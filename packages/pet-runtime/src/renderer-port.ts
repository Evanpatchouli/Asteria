import type { PetState } from "@asteria/shared";

/**
 * Pet states with mandatory renderer actions in the MVP manifest.
 */
export type CorePetState = Exclude<PetState, "sleep" | "waiting">;

/**
 * Complete mapping from mandatory logical states to renderer action names.
 */
export type PetStateActionMap = Readonly<Record<CorePetState, string>>;

/**
 * Minimum renderer capability consumed by the Phase 1 Pet Runtime.
 */
export interface PetRendererPort {
  /** Prepares renderer resources before actions can be played. */
  initialize(): Promise<void>;
  /** Starts the named renderer action. */
  play(action: string): void;
  /** Stops the named renderer action. */
  stop(action: string): void;
  /** Releases renderer resources permanently. */
  destroy(): void;
}
