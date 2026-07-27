import {
  AGENT_EVENT_PROTOCOL_VERSION,
  type AgentEvent,
  type AgentEventType,
} from "@asteria/shared";
import { describe, expect, it, vi } from "vitest";

import { PetRuntime } from "./pet-runtime.js";
import type { PetRendererPort, PetStateActionMap } from "./renderer-port.js";
import type { RuntimeScheduler, ScheduledTask } from "./runtime-scheduler.js";

const STATE_ACTIONS = {
  idle: "idle",
  thinking: "thinking",
  coding: "typing",
  happy: "celebrate",
  error: "error",
} as const satisfies PetStateActionMap;

class ManualScheduler implements RuntimeScheduler {
  readonly tasks: Array<{
    readonly delayMs: number;
    readonly run: ScheduledTask;
    cancelled: boolean;
  }> = [];

  public schedule(delayMs: number, task: ScheduledTask): () => void {
    const scheduledTask = {
      delayMs,
      run: task,
      cancelled: false,
    };
    this.tasks.push(scheduledTask);

    return () => {
      scheduledTask.cancelled = true;
    };
  }

  public runLatest(): void {
    const task = this.tasks.at(-1);

    if (task !== undefined && !task.cancelled) {
      task.run();
    }
  }
}

function createRenderer() {
  const initialize = vi.fn(() => Promise.resolve());
  const play = vi.fn();
  const stop = vi.fn();
  const destroy = vi.fn();
  const port: PetRendererPort = {
    initialize,
    play,
    stop,
    destroy,
  };

  return {
    port,
    initialize,
    play,
    stop,
    destroy,
  };
}

function createEvent(type: AgentEventType): AgentEvent {
  return {
    id: `event-${type}`,
    protocolVersion: AGENT_EVENT_PROTOCOL_VERSION,
    source: "claude",
    type,
    timestamp: 1_722_070_000_000,
  };
}

function createRuntime(
  renderer: ReturnType<typeof createRenderer>,
  scheduler: RuntimeScheduler = new ManualScheduler(),
): PetRuntime {
  return new PetRuntime({
    renderer: renderer.port,
    scheduler,
    stateActions: STATE_ACTIONS,
    transientStateDurationMs: 500,
  });
}

describe("PetRuntime", () => {
  it("initializes once and starts the idle action", async () => {
    const renderer = createRenderer();
    const runtime = createRuntime(renderer);

    await Promise.all([runtime.initialize(), runtime.initialize()]);

    expect(renderer.initialize).toHaveBeenCalledOnce();
    expect(renderer.play).toHaveBeenCalledOnce();
    expect(renderer.play).toHaveBeenCalledWith("idle");
  });

  it("requires initialization before event dispatch", () => {
    const runtime = createRuntime(createRenderer());

    expect(() => runtime.dispatch(createEvent("agent.coding"))).toThrow(
      /must be initialized/,
    );
  });

  it("maps events to ordered renderer action changes", async () => {
    const renderer = createRenderer();
    const runtime = createRuntime(renderer);
    await runtime.initialize();

    runtime.dispatch(createEvent("agent.thinking"));
    runtime.dispatch(createEvent("agent.coding"));

    expect(runtime.currentState()).toBe("coding");
    expect(vi.mocked(renderer.stop).mock.calls).toEqual([
      ["idle"],
      ["thinking"],
    ]);
    expect(vi.mocked(renderer.play).mock.calls).toEqual([
      ["idle"],
      ["thinking"],
      ["typing"],
    ]);
  });

  it("maps success to happy and falls back to idle", async () => {
    const renderer = createRenderer();
    const scheduler = new ManualScheduler();
    const runtime = createRuntime(renderer, scheduler);
    await runtime.initialize();

    runtime.dispatch(createEvent("agent.success"));

    expect(runtime.currentState()).toBe("happy");
    expect(scheduler.tasks.at(-1)?.delayMs).toBe(500);

    scheduler.runLatest();

    expect(runtime.currentState()).toBe("idle");
    expect(renderer.stop).toHaveBeenLastCalledWith("celebrate");
    expect(renderer.play).toHaveBeenLastCalledWith("idle");
  });

  it("keeps error above success until the fallback runs", async () => {
    const renderer = createRenderer();
    const scheduler = new ManualScheduler();
    const runtime = createRuntime(renderer, scheduler);
    await runtime.initialize();

    runtime.dispatch(createEvent("agent.error"));
    runtime.dispatch(createEvent("agent.success"));

    expect(runtime.currentState()).toBe("error");
    expect(renderer.play).toHaveBeenLastCalledWith("error");

    scheduler.runLatest();
    expect(runtime.currentState()).toBe("idle");
  });

  it("lets an idle event reset a transient state and cancel fallback", async () => {
    const renderer = createRenderer();
    const scheduler = new ManualScheduler();
    const runtime = createRuntime(renderer, scheduler);
    await runtime.initialize();

    runtime.dispatch(createEvent("agent.error"));
    runtime.dispatch(createEvent("agent.idle"));

    expect(runtime.currentState()).toBe("idle");
    expect(scheduler.tasks.at(-1)?.cancelled).toBe(true);
  });

  it("restarts the fallback window for a repeated transient event", async () => {
    const renderer = createRenderer();
    const scheduler = new ManualScheduler();
    const runtime = createRuntime(renderer, scheduler);
    await runtime.initialize();

    runtime.dispatch(createEvent("agent.success"));
    runtime.dispatch(createEvent("agent.success"));

    expect(scheduler.tasks).toHaveLength(2);
    expect(scheduler.tasks[0]?.cancelled).toBe(true);
    expect(scheduler.tasks[1]?.cancelled).toBe(false);
  });

  it("destroys once and prevents later dispatch", async () => {
    const renderer = createRenderer();
    const runtime = createRuntime(renderer);
    await runtime.initialize();

    runtime.destroy();
    runtime.destroy();

    expect(renderer.stop).toHaveBeenLastCalledWith("idle");
    expect(renderer.destroy).toHaveBeenCalledOnce();
    expect(() => runtime.dispatch(createEvent("agent.coding"))).toThrow(
      /must be initialized/,
    );
  });

  it("stays destroyed when pending initialization later fails", async () => {
    let rejectInitialization: ((error: Error) => void) | undefined;
    const initialization = new Promise<void>((_resolve, reject) => {
      rejectInitialization = reject;
    });
    const renderer = createRenderer();
    renderer.initialize.mockReturnValueOnce(initialization);
    const runtime = createRuntime(renderer);
    const pendingInitialization = runtime.initialize();

    runtime.destroy();
    rejectInitialization?.(new Error("initialization failed"));

    await expect(pendingInitialization).rejects.toThrow(
      "initialization failed",
    );
    await expect(runtime.initialize()).rejects.toThrow(/has been destroyed/);
    expect(renderer.destroy).toHaveBeenCalledOnce();
  });

  it("rejects a negative transient state duration", () => {
    expect(
      () =>
        new PetRuntime({
          renderer: createRenderer().port,
          scheduler: new ManualScheduler(),
          stateActions: STATE_ACTIONS,
          transientStateDurationMs: -1,
        }),
    ).toThrow(RangeError);
  });
});
