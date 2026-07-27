import type {
  DebugEventCommand,
  DebugTelemetryState,
} from "@asteria/shared/debug-contract";
import { IPC_CHANNELS, type DebugApi } from "@asteria/shared/ipc";

type DebugStateIpcListener = (
  ipcEvent: unknown,
  state: DebugTelemetryState,
) => void;

export interface DebugIpcRendererPort {
  invoke(channel: string, ...args: readonly unknown[]): Promise<unknown>;
  on(channel: string, listener: DebugStateIpcListener): void;
  removeListener(channel: string, listener: DebugStateIpcListener): void;
}

/**
 * Creates the narrow development diagnostics API exposed to the debug window.
 */
export function createDebugApi(ipcRenderer: DebugIpcRendererPort): DebugApi {
  return {
    async closeWindow() {
      await ipcRenderer.invoke(IPC_CHANNELS.debugCloseWindow);
    },
    async clearLogs() {
      await ipcRenderer.invoke(IPC_CHANNELS.debugClearLogs);
    },
    async emitAgentEvent(command: DebugEventCommand) {
      await ipcRenderer.invoke(IPC_CHANNELS.debugEmitAgentEvent, command);
    },
    async getState() {
      return (await ipcRenderer.invoke(
        IPC_CHANNELS.debugGetState,
      )) as DebugTelemetryState;
    },
    async minimizeWindow() {
      await ipcRenderer.invoke(IPC_CHANNELS.debugMinimizeWindow);
    },
    onStateChanged(listener) {
      const ipcListener: DebugStateIpcListener = (_ipcEvent, state) => {
        listener(state);
      };
      let subscribed = true;

      ipcRenderer.on(IPC_CHANNELS.debugStateChanged, ipcListener);

      return () => {
        if (!subscribed) {
          return;
        }

        subscribed = false;
        ipcRenderer.removeListener(IPC_CHANNELS.debugStateChanged, ipcListener);
      };
    },
  };
}
