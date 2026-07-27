export {
  AGENT_EVENT_PROTOCOL_VERSION,
  AGENT_EVENT_SOURCES,
  AGENT_EVENT_TYPES,
  agentEventSchema,
  parseAgentEvent,
} from "./events.js";
export type { AgentEvent, AgentEventSource, AgentEventType } from "./events.js";

export {
  DEBUG_LOG_LEVELS,
  DEBUG_LOG_STAGES,
  DEBUG_RUNTIME_STATUSES,
  debugEventCommandSchema,
  debugLogEntrySchema,
  debugLogInputSchema,
  debugRuntimeSnapshotSchema,
  debugTelemetryReportSchema,
  debugTelemetryStateSchema,
  parseDebugEventCommand,
  parseDebugTelemetryReport,
} from "./debug.js";
export type {
  DebugEventCommand,
  DebugLogEntry,
  DebugLogInput,
  DebugRuntimeSnapshot,
  DebugRuntimeStatus,
  DebugTelemetryReport,
  DebugTelemetryState,
} from "./debug.js";

export { IPC_CHANNELS } from "./ipc.js";
export type {
  DebugApi,
  DebugTelemetryApi,
  DesktopApi,
  IpcChannel,
} from "./ipc.js";

export {
  PET_MANIFEST_PROTOCOL_VERSION,
  PET_STATES,
  parsePetManifest,
  petAnimationSchema,
  petManifestSchema,
} from "./pet-manifest.js";
export type { PetAnimation, PetManifest, PetState } from "./pet-manifest.js";
