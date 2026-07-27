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
import { PetStateMachine, type StateTransition } from "./state-machine.js";

const TRANSIENT_STATES = [
  "happy",
  "error",
] as const satisfies readonly PetState[];

/**
 * Logical states that automatically return to idle after their action finishes.
 */
export type TransientPetState = (typeof TRANSIENT_STATES)[number];

/**
 * Per-state fallback durations for transient pet states.
 */
export type TransientStateDurations = Readonly<
  Record<TransientPetState, number>
>;

const DEFAULT_TRANSIENT_STATE_DURATIONS = {
  happy: 2_400,
  error: 2_400,
} as const satisfies TransientStateDurations;

const TRANSIENT_STATE_SET = new Set<PetState>(TRANSIENT_STATES);

function isTransientPetState(state: PetState): state is TransientPetState {
  return TRANSIENT_STATE_SET.has(state);
}

/**
 * Dependencies and behavior settings required to construct a Pet Runtime.
 */
export interface PetRuntimeOptions {
  /** Renderer controlled exclusively by the Runtime. */
  readonly renderer: PetRendererPort;
  /** Scheduler used for transient-state fallback tasks. */
  readonly scheduler: RuntimeScheduler;
  /** Maps logical states to renderer action names. */
  readonly stateActions: PetStateActionMap;
  /** Per-state durations before transient states return to idle. */
  readonly transientStateDurationsMs?: Readonly<
    Partial<TransientStateDurations>
  >;
}

/**
 * Lifecycle status exposed by Pet Runtime snapshots.
 */
export type RuntimeStatus = "created" | "destroyed" | "initializing" | "ready";

/**
 * Immutable, point-in-time view of Pet Runtime state.
 */
export interface PetRuntimeSnapshot {
  /** Current Runtime lifecycle status. */
  readonly status: RuntimeStatus;
  /** Current logical pet state. */
  readonly state: PetState;
  /** Renderer action currently playing, or `null` when none is active. */
  readonly action: string | null;
}

/**
 * Receives read-only Pet Runtime snapshots.
 */
export type PetRuntimeObserver = (snapshot: PetRuntimeSnapshot) => void;

/**
 * Stops a Pet Runtime observer from receiving future snapshots.
 */
export type UnsubscribePetRuntimeObserver = () => void;

/**
 * Converts Agent Events into state transitions and renderer actions.
 */
export class PetRuntime {
  readonly #renderer: PetRendererPort;
  readonly #scheduler: RuntimeScheduler;
  readonly #stateActions: PetStateActionMap;
  readonly #stateMachine = new PetStateMachine();
  readonly #transientStateDurationsMs: TransientStateDurations;
  readonly #observers = new Set<PetRuntimeObserver>();
  #cancelFallback: CancelScheduledTask | undefined;
  #initialization: Promise<void> | undefined;
  #status: RuntimeStatus = "created";

  public constructor(options: PetRuntimeOptions) {
    const transientStateDurationsMs: TransientStateDurations = {
      ...DEFAULT_TRANSIENT_STATE_DURATIONS,
      ...options.transientStateDurationsMs,
    };

    for (const [state, durationMs] of Object.entries(
      transientStateDurationsMs,
    )) {
      if (!Number.isFinite(durationMs) || durationMs < 0) {
        throw new RangeError(
          `transientStateDurationsMs.${state} must be a finite, non-negative number.`,
        );
      }
    }

    this.#renderer = options.renderer;
    this.#scheduler = options.scheduler;
    this.#stateActions = options.stateActions;
    this.#transientStateDurationsMs = transientStateDurationsMs;
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
    this.#notifyObservers();
    this.#initialization = this.#renderer
      .initialize()
      .then(() => {
        if (this.#status === "destroyed") {
          return;
        }

        this.#status = "ready";
        this.#renderer.play(this.#actionFor(this.#stateMachine.current()));
        this.#notifyObservers();
      })
      .catch((error: unknown) => {
        if (this.#status !== "destroyed") {
          this.#status = "created";
          this.#initialization = undefined;
          this.#notifyObservers();
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
   * Returns an immutable snapshot of the current Runtime state.
   */
  public snapshot(): PetRuntimeSnapshot {
    const state = this.#stateMachine.current();

    return Object.freeze({
      status: this.#status,
      state,
      action: this.#status === "ready" ? this.#actionFor(state) : null,
    });
  }

  /**
   * Observes Runtime snapshots and immediately receives the current snapshot.
   *
   * Observer failures are isolated from Runtime behavior.
   */
  public subscribe(
    observer: PetRuntimeObserver,
  ): UnsubscribePetRuntimeObserver {
    this.#observers.add(observer);
    this.#notifyObserver(observer);

    return () => {
      this.#observers.delete(observer);
    };
  }

  /**
   * Converts and applies a validated Agent Event, returning its transition.
   */
  public dispatch(event: AgentEvent): StateTransition {
    this.#assertReady();

    const nextState = mapAgentEventToPetState(event.type);
    const force = event.type === "agent.idle";
    const transition = this.#stateMachine.transition(nextState, { force });

    if (transition.status === "unchanged") {
      if (
        transition.reason === "same-state" &&
        isTransientPetState(transition.state)
      ) {
        this.#scheduleFallback(transition.state);
      }

      return transition;
    }

    this.#cancelScheduledFallback();
    this.#renderer.stop(this.#actionFor(transition.from));
    this.#renderer.play(this.#actionFor(transition.to));
    this.#notifyObservers();

    if (isTransientPetState(transition.to)) {
      this.#scheduleFallback(transition.to);
    }

    return transition;
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
    this.#notifyObservers();
    this.#observers.clear();
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

  #scheduleFallback(state: TransientPetState): void {
    this.#cancelScheduledFallback();
    this.#cancelFallback = this.#scheduler.schedule(
      this.#transientStateDurationsMs[state],
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
          this.#notifyObservers();
        }
      },
    );
  }

  #cancelScheduledFallback(): void {
    this.#cancelFallback?.();
    this.#cancelFallback = undefined;
  }

  #notifyObservers(): void {
    for (const observer of this.#observers) {
      this.#notifyObserver(observer);
    }
  }

  #notifyObserver(observer: PetRuntimeObserver): void {
    try {
      observer(this.snapshot());
    } catch {
      // Observability is a side channel and must not alter Runtime behavior.
    }
  }
}
