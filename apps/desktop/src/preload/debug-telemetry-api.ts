import type { DebugTelemetryReport } from "@asteria/shared/debug-contract";
import { IPC_CHANNELS, type DebugTelemetryApi } from "@asteria/shared/ipc";

export interface IpcRendererTelemetryPort {
  send(channel: string, report: DebugTelemetryReport): void;
}

/**
 * Creates the narrow one-way diagnostics reporter used by the desktop window.
 */
export function createDebugTelemetryApi(
  ipcRenderer: IpcRendererTelemetryPort,
): DebugTelemetryApi {
  return {
    report(report) {
      ipcRenderer.send(IPC_CHANNELS.debugTelemetryReport, report);
    },
  };
}
