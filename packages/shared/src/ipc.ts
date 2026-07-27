import type { AgentEvent } from "./events.js";

export const IPC_CHANNELS = {
  agentEvent: "agent:event",
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
