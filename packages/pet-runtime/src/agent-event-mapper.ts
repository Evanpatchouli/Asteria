import type { AgentEventType, PetState } from "@asteria/shared";

const AGENT_EVENT_STATE_MAP = {
  "agent.idle": "idle",
  "agent.thinking": "thinking",
  "agent.coding": "coding",
  "agent.tool_call": "coding",
  "agent.success": "happy",
  "agent.error": "error",
} as const satisfies Readonly<Record<AgentEventType, PetState>>;

/**
 * Maps the external Agent Event vocabulary to internal pet states.
 */
export function mapAgentEventToPetState(type: AgentEventType): PetState {
  return AGENT_EVENT_STATE_MAP[type];
}
