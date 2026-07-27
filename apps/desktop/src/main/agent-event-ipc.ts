import {
  IPC_CHANNELS,
  parseAgentEvent,
  type AgentEvent,
} from "@asteria/shared";

export interface AgentEventIpcTarget {
  send(channel: string, event: AgentEvent): void;
}

/**
 * Validates an external Agent Event before forwarding it across the IPC
 * boundary. Main Process adapters must use this function instead of sending
 * directly to the shared channel.
 */
export function forwardAgentEvent(
  target: AgentEventIpcTarget,
  input: unknown,
): AgentEvent {
  const event = parseAgentEvent(input);
  target.send(IPC_CHANNELS.agentEvent, event);
  return event;
}
