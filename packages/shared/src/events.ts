import { z } from "zod";

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

export const agentEventSchema = z
  .object({
    id: z.string().min(1),
    protocolVersion: z.literal(AGENT_EVENT_PROTOCOL_VERSION),
    source: z.enum(AGENT_EVENT_SOURCES),
    type: z.enum(AGENT_EVENT_TYPES),
    timestamp: z.number().int().nonnegative(),
    payload: z.unknown().optional(),
  })
  .strict();

export type AgentEventSource = (typeof AGENT_EVENT_SOURCES)[number];
export type AgentEventType = (typeof AGENT_EVENT_TYPES)[number];
export type AgentEvent = z.infer<typeof agentEventSchema>;

/**
 * Validates unknown input at an integration boundary and returns a typed event.
 */
export function parseAgentEvent(input: unknown): AgentEvent {
  return agentEventSchema.parse(input);
}
