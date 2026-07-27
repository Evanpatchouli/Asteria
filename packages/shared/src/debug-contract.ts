import type { PetState } from "./pet-manifest.js";
import type { AgentEvent, AgentEventType } from "./event-contract.js";

export const DEBUG_LOG_LEVELS = ["info", "error"] as const;
export const DEBUG_LOG_STAGES = [
  "main",
  "event-bus",
  "runtime",
  "renderer",
] as const;
export const DEBUG_RUNTIME_STATUSES = [
  "created",
  "initializing",
  "ready",
  "destroyed",
] as const;

export type DebugLogLevel = (typeof DEBUG_LOG_LEVELS)[number];
export type DebugLogStage = (typeof DEBUG_LOG_STAGES)[number];
export type DebugRuntimeStatus = (typeof DEBUG_RUNTIME_STATUSES)[number];

/** Development-panel intent to emit one standard Agent Event type. */
export interface DebugEventCommand {
  readonly type: AgentEventType;
}

/** Structured, bilingual diagnostics emitted before Main assigns metadata. */
export interface DebugLogInput {
  readonly detail: {
    readonly en: string;
    readonly zh: string;
  };
  readonly event: string;
  readonly level: DebugLogLevel;
  readonly stage: DebugLogStage;
}

/** One Main-stamped entry in the bounded diagnostics history. */
export interface DebugLogEntry extends DebugLogInput {
  readonly sequence: number;
  readonly timestamp: number;
}

/** Read-only runtime data displayed by the development diagnostics panel. */
export interface DebugRuntimeSnapshot {
  readonly activeAction: string | null;
  readonly eventsProcessed: number;
  readonly lastEvent: AgentEvent | null;
  readonly petState: PetState;
  readonly status: DebugRuntimeStatus;
}

/** Low-frequency telemetry accepted from the desktop Renderer. */
export type DebugTelemetryReport =
  | {
      readonly kind: "log";
      readonly log: DebugLogInput;
    }
  | {
      readonly kind: "runtime";
      readonly snapshot: DebugRuntimeSnapshot;
    };

/** Complete diagnostics state broadcast from Main to the debug window. */
export interface DebugTelemetryState {
  readonly connected: boolean;
  readonly logs: readonly DebugLogEntry[];
  readonly runtime: DebugRuntimeSnapshot;
  readonly sequence: number;
}
