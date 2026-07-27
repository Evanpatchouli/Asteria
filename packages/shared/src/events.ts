import { z } from "zod";

import {
  AGENT_EVENT_PROTOCOL_VERSION,
  AGENT_EVENT_SOURCES,
  AGENT_EVENT_TYPES,
} from "./event-contract.js";
import type { AgentEvent } from "./event-contract.js";

export {
  AGENT_EVENT_PROTOCOL_VERSION,
  AGENT_EVENT_SOURCES,
  AGENT_EVENT_TYPES,
} from "./event-contract.js";
export type {
  AgentEvent,
  AgentEventSource,
  AgentEventType,
} from "./event-contract.js";

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

/**
 * Validates unknown input at an integration boundary and returns a typed event.
 */
export function parseAgentEvent(input: unknown): AgentEvent {
  return agentEventSchema.parse(input);
}
