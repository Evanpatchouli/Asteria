import type {
  DebugEventCommand,
  DebugTelemetryReport,
  DebugTelemetryState,
} from "./debug-contract.js";
import type { AgentEvent } from "./event-contract.js";

export const IPC_CHANNELS = {
  agentEvent: "agent:event",
  debugCloseWindow: "debug:close-window",
  debugClearLogs: "debug:clear-logs",
  debugEmitAgentEvent: "debug:emit-agent-event",
  debugGetState: "debug:get-state",
  debugMinimizeWindow: "debug:minimize-window",
  debugStateChanged: "debug:state-changed",
  debugTelemetryReport: "debug:telemetry-report",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface DesktopApi {
  /**
   * Subscribes to validated Agent Events forwarded by the main process.
   *
   * @returns A function that removes the listener.
   */
  onAgentEvent(listener: (event: AgentEvent) => void): () => void;
}

export interface DebugApi {
  /** Closes the current development diagnostics window. */
  closeWindow(): Promise<void>;

  /** Clears the in-memory diagnostics log. */
  clearLogs(): Promise<void>;

  /** Emits one validated simulated Agent Event through the Main Process. */
  emitAgentEvent(command: DebugEventCommand): Promise<void>;

  /** Returns the latest diagnostics state and bounded log history. */
  getState(): Promise<DebugTelemetryState>;

  /** Minimizes the current development diagnostics window. */
  minimizeWindow(): Promise<void>;

  /**
   * Subscribes to diagnostics state updates.
   *
   * @returns A function that removes the listener.
   */
  onStateChanged(listener: (state: DebugTelemetryState) => void): () => void;
}

export interface DebugTelemetryApi {
  /** Reports low-frequency structured Runtime diagnostics to the Main Process. */
  report(report: DebugTelemetryReport): void;
}
