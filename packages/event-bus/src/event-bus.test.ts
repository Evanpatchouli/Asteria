import {
  AGENT_EVENT_PROTOCOL_VERSION,
  type AgentEvent,
  type AgentEventType,
} from "@asteria/shared";
import { describe, expect, it, vi } from "vitest";

import { InMemoryEventBus, type AgentEventHandler } from "./event-bus.js";

function createEvent(
  id: string,
  type: AgentEventType = "agent.coding",
): AgentEvent {
  return {
    id,
    protocolVersion: AGENT_EVENT_PROTOCOL_VERSION,
    source: "claude",
    type,
    timestamp: 1_722_070_000_000,
  };
}

describe("InMemoryEventBus", () => {
  it("only delivers events to handlers of the matching type", async () => {
    const bus = new InMemoryEventBus();
    const codingHandler = vi.fn();
    const idleHandler = vi.fn();

    bus.on("agent.coding", codingHandler);
    bus.on("agent.idle", idleHandler);

    await bus.emit(createEvent("event-1"));

    expect(codingHandler).toHaveBeenCalledOnce();
    expect(idleHandler).not.toHaveBeenCalled();
  });

  it("serializes events and preserves subscription order", async () => {
    const bus = new InMemoryEventBus();
    const calls: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    bus.on("agent.coding", async (event) => {
      calls.push(`first:start:${event.id}`);

      if (event.id === "event-1") {
        await firstGate;
      }

      calls.push(`first:end:${event.id}`);
    });
    bus.on("agent.coding", (event) => {
      calls.push(`second:${event.id}`);
    });

    const firstDelivery = bus.emit(createEvent("event-1"));
    const secondDelivery = bus.emit(createEvent("event-2"));

    await Promise.resolve();
    expect(calls).toEqual(["first:start:event-1"]);

    releaseFirst?.();
    await Promise.all([firstDelivery, secondDelivery]);

    expect(calls).toEqual([
      "first:start:event-1",
      "first:end:event-1",
      "second:event-1",
      "first:start:event-2",
      "first:end:event-2",
      "second:event-2",
    ]);
  });

  it("isolates handler and error reporter failures", async () => {
    const calls: string[] = [];
    const failure = new Error("handler failed");
    const onHandlerError = vi.fn(() => {
      throw new Error("reporter failed");
    });
    const bus = new InMemoryEventBus({ onHandlerError });

    bus.on("agent.coding", () => {
      calls.push("failing");
      throw failure;
    });
    bus.on("agent.coding", () => {
      calls.push("healthy");
    });

    await expect(bus.emit(createEvent("event-1"))).resolves.toBeUndefined();

    expect(calls).toEqual(["failing", "healthy"]);
    expect(onHandlerError).toHaveBeenCalledWith({
      error: failure,
      event: createEvent("event-1"),
    });
  });

  it("supports idempotent unsubscribe functions", async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.on("agent.coding", handler);

    unsubscribe();
    unsubscribe();
    await bus.emit(createEvent("event-1"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("supports removing a handler through off", async () => {
    const bus = new InMemoryEventBus();
    const handler: AgentEventHandler<"agent.coding"> = vi.fn();

    bus.on("agent.coding", handler);
    bus.off("agent.coding", handler);
    await bus.emit(createEvent("event-1"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not register the same handler twice for one type", async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    bus.on("agent.coding", handler);
    bus.on("agent.coding", handler);
    await bus.emit(createEvent("event-1"));

    expect(handler).toHaveBeenCalledOnce();
  });
});
