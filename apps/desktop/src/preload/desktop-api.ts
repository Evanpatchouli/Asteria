import type { AgentEvent } from "@asteria/shared";
import { IPC_CHANNELS, type DesktopApi } from "@asteria/shared/ipc";

type AgentEventIpcListener = (ipcEvent: unknown, payload: AgentEvent) => void;

/**
 * Restricts the preload implementation to subscription-only IPC operations.
 */
export interface IpcRendererSubscriptionPort {
  on(channel: string, listener: AgentEventIpcListener): void;
  removeListener(channel: string, listener: AgentEventIpcListener): void;
}

/**
 * Creates the renderer-facing desktop API from the minimal IPC subscription
 * operations required by the preload bridge.
 */
export function createDesktopApi(
  ipcRenderer: IpcRendererSubscriptionPort,
): DesktopApi {
  return {
    onAgentEvent(listener) {
      const ipcListener: AgentEventIpcListener = (_ipcEvent, payload) => {
        listener(payload);
      };
      let subscribed = true;

      ipcRenderer.on(IPC_CHANNELS.agentEvent, ipcListener);

      return () => {
        if (!subscribed) {
          return;
        }

        subscribed = false;
        ipcRenderer.removeListener(IPC_CHANNELS.agentEvent, ipcListener);
      };
    },
  };
}
