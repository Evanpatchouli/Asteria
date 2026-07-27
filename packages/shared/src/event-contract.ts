export const AGENT_EVENT_PROTOCOL_VERSION = "1.0" as const;

export const AGENT_EVENT_SOURCES = [
  "claude",
  "codex",
  "mcp",
  "game",
  "custom",
] as const;

export const AGENT_EVENT_TYPES = [
  "agent.idle",
  "agent.thinking",
  "agent.coding",
  "agent.tool_call",
  "agent.success",
  "agent.error",
] as const;

export type AgentEventSource = (typeof AGENT_EVENT_SOURCES)[number];
export type AgentEventType = (typeof AGENT_EVENT_TYPES)[number];

/** Canonical event exchanged between Agent adapters and the desktop runtime. */
export interface AgentEvent {
  readonly id: string;
  readonly payload?: unknown;
  readonly protocolVersion: typeof AGENT_EVENT_PROTOCOL_VERSION;
  readonly source: AgentEventSource;
  readonly timestamp: number;
  readonly type: AgentEventType;
}
