import {
  AGENT_EVENT_PROTOCOL_VERSION,
  IPC_CHANNELS,
  type AgentEvent,
} from "@asteria/shared";
import { describe, expect, it, vi } from "vitest";

import {
  createDesktopApi,
  type IpcRendererSubscriptionPort,
} from "./desktop-api.js";

function createAgentEvent(): AgentEvent {
  return {
    id: "event-1",
    protocolVersion: AGENT_EVENT_PROTOCOL_VERSION,
    source: "claude",
    type: "agent.coding",
    timestamp: 1_722_070_000_000,
    payload: { file: "src/main.ts" },
  };
}

function createIpcRendererMock(): {
  ipcRenderer: IpcRendererSubscriptionPort;
  on: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
} {
  const on = vi.fn();
  const removeListener = vi.fn();

  return {
    ipcRenderer: { on, removeListener },
    on,
    removeListener,
  };
}

describe("createDesktopApi", () => {
  it("subscribes only to the shared Agent Event channel", () => {
    const { ipcRenderer, on } = createIpcRendererMock();
    const api = createDesktopApi(ipcRenderer);

    api.onAgentEvent(vi.fn());

    expect(on).toHaveBeenCalledOnce();
    expect(on).toHaveBeenCalledWith(
      IPC_CHANNELS.agentEvent,
      expect.any(Function),
    );
  });

  it("forwards only the Agent Event payload to the renderer callback", () => {
    const { ipcRenderer, on } = createIpcRendererMock();
    const api = createDesktopApi(ipcRenderer);
    const listener = vi.fn();
    const event = createAgentEvent();

    api.onAgentEvent(listener);
    const ipcListener = on.mock.calls[0]?.[1] as (
      ipcEvent: unknown,
      payload: AgentEvent,
    ) => void;
    ipcListener({ sender: "must-not-leak" }, event);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(event);
  });

  it("removes the same wrapper listener and unsubscribes idempotently", () => {
    const { ipcRenderer, on, removeListener } = createIpcRendererMock();
    const api = createDesktopApi(ipcRenderer);
    const unsubscribe = api.onAgentEvent(vi.fn());
    const registeredListener: unknown = on.mock.calls[0]?.[1];

    unsubscribe();
    unsubscribe();

    expect(removeListener).toHaveBeenCalledOnce();
    expect(removeListener).toHaveBeenCalledWith(
      IPC_CHANNELS.agentEvent,
      registeredListener,
    );
  });
});
