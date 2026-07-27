import { z } from "zod";

import {
  DEBUG_LOG_LEVELS,
  DEBUG_LOG_STAGES,
  DEBUG_RUNTIME_STATUSES,
} from "./debug-contract.js";
import type {
  DebugEventCommand,
  DebugTelemetryReport,
} from "./debug-contract.js";
import { AGENT_EVENT_TYPES } from "./event-contract.js";
import { agentEventSchema } from "./events.js";
import { PET_STATES } from "./pet-manifest.js";

export {
  DEBUG_LOG_LEVELS,
  DEBUG_LOG_STAGES,
  DEBUG_RUNTIME_STATUSES,
} from "./debug-contract.js";
export type {
  DebugEventCommand,
  DebugLogEntry,
  DebugLogInput,
  DebugRuntimeSnapshot,
  DebugRuntimeStatus,
  DebugTelemetryReport,
  DebugTelemetryState,
} from "./debug-contract.js";

export const debugEventCommandSchema = z
  .object({
    type: z.enum(AGENT_EVENT_TYPES),
  })
  .strict();

export const debugLogInputSchema = z
  .object({
    detail: z
      .object({
        en: z.string().min(1),
        zh: z.string().min(1),
      })
      .strict(),
    event: z.string().min(1),
    level: z.enum(DEBUG_LOG_LEVELS),
    stage: z.enum(DEBUG_LOG_STAGES),
  })
  .strict();

export const debugLogEntrySchema = debugLogInputSchema.extend({
  sequence: z.number().int().positive(),
  timestamp: z.number().int().nonnegative(),
});

export const debugRuntimeSnapshotSchema = z
  .object({
    activeAction: z.string().min(1).nullable(),
    eventsProcessed: z.number().int().nonnegative(),
    lastEvent: agentEventSchema.nullable(),
    petState: z.enum(PET_STATES),
    status: z.enum(DEBUG_RUNTIME_STATUSES),
  })
  .strict();

export const debugTelemetryReportSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("log"),
      log: debugLogInputSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal("runtime"),
      snapshot: debugRuntimeSnapshotSchema,
    })
    .strict(),
]);

export const debugTelemetryStateSchema = z
  .object({
    connected: z.boolean(),
    logs: z.array(debugLogEntrySchema).max(200),
    runtime: debugRuntimeSnapshotSchema,
    sequence: z.number().int().nonnegative(),
  })
  .strict();

/** Validates a simulated Agent Event command at the Main Process boundary. */
export function parseDebugEventCommand(input: unknown): DebugEventCommand {
  return debugEventCommandSchema.parse(input);
}

/** Validates a desktop Runtime telemetry report at the IPC boundary. */
export function parseDebugTelemetryReport(
  input: unknown,
): DebugTelemetryReport {
  return debugTelemetryReportSchema.parse(input);
}
