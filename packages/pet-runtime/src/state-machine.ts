import type { PetState } from "@asteria/shared";

/** Priority table used to arbitrate non-forced state transitions. */
export const PET_STATE_PRIORITY = {
  idle: 0,
  sleep: 0,
  waiting: 1,
  thinking: 2,
  coding: 3,
  tooling: 3,
  happy: 4,
  error: 5,
} as const satisfies Readonly<Record<PetState, number>>;

export interface ChangedStateTransition {
  readonly status: "changed";
  readonly from: PetState;
  readonly to: PetState;
}

export interface UnchangedStateTransition {
  readonly status: "unchanged";
  readonly reason: "lower-priority" | "same-state";
  readonly state: PetState;
}

export type StateTransition = ChangedStateTransition | UnchangedStateTransition;

export interface StateTransitionOptions {
  readonly force?: boolean;
}

/**
 * Pure pet state machine with explicit priority and forced-reset semantics.
 */
export class PetStateMachine {
  #currentState: PetState;

  public constructor(initialState: PetState = "idle") {
    this.#currentState = initialState;
  }

  /**
   * Returns the current logical state.
   */
  public current(): PetState {
    return this.#currentState;
  }

  /**
   * Attempts a transition without invoking renderer behavior.
   */
  public transition(
    nextState: PetState,
    options: StateTransitionOptions = {},
  ): StateTransition {
    const previousState = this.#currentState;

    if (nextState === previousState) {
      return {
        status: "unchanged",
        reason: "same-state",
        state: previousState,
      };
    }

    if (
      options.force !== true &&
      PET_STATE_PRIORITY[nextState] < PET_STATE_PRIORITY[previousState]
    ) {
      return {
        status: "unchanged",
        reason: "lower-priority",
        state: previousState,
      };
    }

    this.#currentState = nextState;

    return {
      status: "changed",
      from: previousState,
      to: nextState,
    };
  }
}
