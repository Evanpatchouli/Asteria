import {
  AGENT_EVENT_PROTOCOL_VERSION,
  IPC_CHANNELS,
  type AgentEvent,
} from "@asteria/shared";
import { describe, expect, it, vi } from "vitest";

import { forwardAgentEvent } from "./agent-event-ipc.js";

function createAgentEvent(): AgentEvent {
  return {
    id: "event-1",
    protocolVersion: AGENT_EVENT_PROTOCOL_VERSION,
    source: "claude",
    timestamp: 1_722_070_000_000,
    type: "agent.coding",
  };
}

describe("forwardAgentEvent", () => {
  it("validates and forwards an Agent Event on the shared channel", () => {
    const send = vi.fn();
    const event = createAgentEvent();

    expect(forwardAgentEvent({ send }, event)).toEqual(event);
    expect(send).toHaveBeenCalledWith(IPC_CHANNELS.agentEvent, event);
  });

  it("rejects invalid input before it reaches IPC", () => {
    const send = vi.fn();

    expect(() =>
      forwardAgentEvent(
        { send },
        {
          ...createAgentEvent(),
          protocolVersion: "unsupported",
        },
      ),
    ).toThrow();
    expect(send).not.toHaveBeenCalled();
  });
});
