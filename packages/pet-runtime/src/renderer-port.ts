import type { PetState } from "@asteria/shared";

export type CorePetState = Exclude<PetState, "sleep" | "waiting">;

export type PetStateActionMap = Readonly<Record<CorePetState, string>>;

/**
 * Minimum renderer capability consumed by the Phase 1 Pet Runtime.
 */
export interface PetRendererPort {
  initialize(): Promise<void>;
  play(action: string): void;
  stop(action: string): void;
  destroy(): void;
}
