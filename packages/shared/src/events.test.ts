import { describe, expect, it } from "vitest";

import { AGENT_EVENT_PROTOCOL_VERSION, parseAgentEvent } from "./events.js";

describe("parseAgentEvent", () => {
  it("accepts a namespaced Agent Event", () => {
    const event = parseAgentEvent({
      id: "event-1",
      protocolVersion: AGENT_EVENT_PROTOCOL_VERSION,
      source: "claude",
      type: "agent.coding",
      timestamp: 1_722_070_000_000,
      payload: {
        tool: "Edit",
      },
    });

    expect(event.type).toBe("agent.coding");
  });

  it("rejects an event without the agent namespace", () => {
    expect(() =>
      parseAgentEvent({
        id: "event-2",
        protocolVersion: AGENT_EVENT_PROTOCOL_VERSION,
        source: "claude",
        type: "coding",
        timestamp: 1_722_070_000_000,
      }),
    ).toThrow();
  });

  it("rejects unknown fields at an integration boundary", () => {
    expect(() =>
      parseAgentEvent({
        id: "event-3",
        protocolVersion: AGENT_EVENT_PROTOCOL_VERSION,
        source: "claude",
        type: "agent.idle",
        timestamp: 1_722_070_000_000,
        executable: "untrusted-command",
      }),
    ).toThrow();
  });
});
