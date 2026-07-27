import type { PetStateActionMap } from "@asteria/pet-runtime";

/**
 * Action names understood by the Phase 1 placeholder animation.
 */
export const PLACEHOLDER_STATE_ACTIONS = {
  coding: "typing",
  error: "error",
  happy: "celebrate",
  idle: "idle",
  thinking: "thinking",
} as const satisfies PetStateActionMap;

export type PlaceholderAction =
  (typeof PLACEHOLDER_STATE_ACTIONS)[keyof typeof PLACEHOLDER_STATE_ACTIONS];
