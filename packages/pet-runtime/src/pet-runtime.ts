import type { AgentEvent, PetState } from "@asteria/shared";

import { mapAgentEventToPetState } from "./agent-event-mapper.js";
import type {
  CorePetState,
  PetRendererPort,
  PetStateActionMap,
} from "./renderer-port.js";
import type {
  CancelScheduledTask,
  RuntimeScheduler,
} from "./runtime-scheduler.js";
import { PetStateMachine } from "./state-machine.js";

const TRANSIENT_STATES = new Set<PetState>(["error", "happy"]);

export interface PetRuntimeOptions {
  readonly renderer: PetRendererPort;
  readonly scheduler: RuntimeScheduler;
  readonly stateActions: PetStateActionMap;
  readonly transientStateDurationMs?: number;
}

type RuntimeStatus = "created" | "destroyed" | "initializing" | "ready";

/**
 * Converts Agent Events into state transitions and renderer actions.
 */
export class PetRuntime {
  readonly #renderer: PetRendererPort;
  readonly #scheduler: RuntimeScheduler;
  readonly #stateActions: PetStateActionMap;
  readonly #stateMachine = new PetStateMachine();
  readonly #transientStateDurationMs: number;
  #cancelFallback: CancelScheduledTask | undefined;
  #initialization: Promise<void> | undefined;
  #status: RuntimeStatus = "created";

  public constructor(options: PetRuntimeOptions) {
    if (
      options.transientStateDurationMs !== undefined &&
      options.transientStateDurationMs < 0
    ) {
      throw new RangeError("transientStateDurationMs must not be negative.");
    }

    this.#renderer = options.renderer;
    this.#scheduler = options.scheduler;
    this.#stateActions = options.stateActions;
    this.#transientStateDurationMs = options.transientStateDurationMs ?? 1_200;
  }

  /**
   * Initializes the renderer and starts the current state's action.
   */
  public initialize(): Promise<void> {
    if (this.#status === "destroyed") {
      return Promise.reject(new Error("PetRuntime has been destroyed."));
    }

    if (this.#initialization !== undefined) {
      return this.#initialization;
    }

    this.#status = "initializing";
    this.#initialization = this.#renderer
      .initialize()
      .then(() => {
        if (this.#status === "destroyed") {
          return;
        }

        this.#status = "ready";
        this.#renderer.play(this.#actionFor(this.#stateMachine.current()));
      })
      .catch((error: unknown) => {
        if (this.#status !== "destroyed") {
          this.#status = "created";
          this.#initialization = undefined;
        }

        throw error;
      });

    return this.#initialization;
  }

  /**
   * Returns the current logical pet state.
   */
  public currentState(): PetState {
    return this.#stateMachine.current();
  }

  /**
   * Converts and applies a validated Agent Event.
   */
  public dispatch(event: AgentEvent): void {
    this.#assertReady();

    const nextState = mapAgentEventToPetState(event.type);
    const force = event.type === "agent.idle";
    const transition = this.#stateMachine.transition(nextState, { force });

    if (transition.status === "unchanged") {
      if (
        transition.reason === "same-state" &&
        TRANSIENT_STATES.has(transition.state)
      ) {
        this.#scheduleFallback();
      }

      return;
    }

    this.#cancelScheduledFallback();
    this.#renderer.stop(this.#actionFor(transition.from));
    this.#renderer.play(this.#actionFor(transition.to));

    if (TRANSIENT_STATES.has(transition.to)) {
      this.#scheduleFallback();
    }
  }

  /**
   * Stops runtime activity and destroys the renderer.
   */
  public destroy(): void {
    if (this.#status === "destroyed") {
      return;
    }

    const wasReady = this.#status === "ready";
    this.#status = "destroyed";
    this.#cancelScheduledFallback();

    if (wasReady) {
      this.#renderer.stop(this.#actionFor(this.#stateMachine.current()));
    }

    this.#renderer.destroy();
  }

  #actionFor(state: PetState): string {
    if (state === "sleep" || state === "waiting") {
      throw new Error(`No Phase 1 action is defined for state "${state}".`);
    }

    return this.#stateActions[state satisfies CorePetState];
  }

  #assertReady(): void {
    if (this.#status !== "ready") {
      throw new Error("PetRuntime must be initialized before dispatch.");
    }
  }

  #scheduleFallback(): void {
    this.#cancelScheduledFallback();
    this.#cancelFallback = this.#scheduler.schedule(
      this.#transientStateDurationMs,
      () => {
        this.#cancelFallback = undefined;

        if (this.#status !== "ready") {
          return;
        }

        const transition = this.#stateMachine.transition("idle", {
          force: true,
        });

        if (transition.status === "changed") {
          this.#renderer.stop(this.#actionFor(transition.from));
          this.#renderer.play(this.#actionFor(transition.to));
        }
      },
    );
  }

  #cancelScheduledFallback(): void {
    this.#cancelFallback?.();
    this.#cancelFallback = undefined;
  }
}
