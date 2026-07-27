import { describe, expect, it } from "vitest";

import { mapAgentEventToPetState } from "./agent-event-mapper.js";

describe("mapAgentEventToPetState", () => {
  it.each([
    ["agent.idle", "idle"],
    ["agent.thinking", "thinking"],
    ["agent.coding", "coding"],
    ["agent.tool_call", "tooling"],
    ["agent.success", "happy"],
    ["agent.error", "error"],
  ] as const)("maps %s to %s", (eventType, state) => {
    expect(mapAgentEventToPetState(eventType)).toBe(state);
  });
});
