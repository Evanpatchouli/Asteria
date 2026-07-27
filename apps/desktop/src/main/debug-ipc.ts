import {
  AGENT_EVENT_PROTOCOL_VERSION,
  IPC_CHANNELS,
  parseDebugEventCommand,
  parseDebugTelemetryReport,
  type AgentEvent,
} from "@asteria/shared";
import {
  BrowserWindow,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  type WebContents,
} from "electron";
import { randomUUID } from "node:crypto";

import { forwardAgentEvent } from "./agent-event-ipc.js";
import type { DebugTelemetryHub } from "./debug-telemetry-hub.js";

export interface DebugIpcOptions {
  readonly getDebugWebContents: () => WebContents | undefined;
  readonly getDesktopWebContents: () => WebContents | undefined;
  readonly telemetryHub: DebugTelemetryHub;
}

/**
 * Registers development-only debug IPC handlers.
 *
 * @returns A function that removes every handler and subscription.
 */
export function registerDebugIpc(options: DebugIpcOptions): () => void {
  const handleCloseWindow = (event: IpcMainInvokeEvent): void => {
    assertSender(event, options.getDebugWebContents());
    BrowserWindow.fromWebContents(event.sender)?.close();
  };
  const handleGetState = (event: IpcMainInvokeEvent) => {
    assertSender(event, options.getDebugWebContents());
    return options.telemetryHub.snapshot();
  };
  const handleClearLogs = (event: IpcMainInvokeEvent): void => {
    assertSender(event, options.getDebugWebContents());
    options.telemetryHub.clearLogs();
  };
  const handleEmitAgentEvent = (
    event: IpcMainInvokeEvent,
    input: unknown,
  ): void => {
    assertSender(event, options.getDebugWebContents());

    const command = parseDebugEventCommand(input);
    const desktopWebContents = options.getDesktopWebContents();

    if (!desktopWebContents || desktopWebContents.isDestroyed()) {
      throw new Error("The desktop Renderer is unavailable.");
    }

    const agentEvent: AgentEvent = {
      id: randomUUID(),
      protocolVersion: AGENT_EVENT_PROTOCOL_VERSION,
      source: "custom",
      timestamp: Date.now(),
      type: command.type,
      payload: {
        origin: "debug-panel",
      },
    };

    options.telemetryHub.appendLog({
      detail: {
        en: `Accepted ${agentEvent.type} from the debug panel`,
        zh: `已接收调试面板发送的 ${agentEvent.type}`,
      },
      event: "event.accepted",
      level: "info",
      stage: "main",
    });
    forwardAgentEvent(desktopWebContents, agentEvent);
  };
  const handleMinimizeWindow = (event: IpcMainInvokeEvent): void => {
    assertSender(event, options.getDebugWebContents());
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  };
  const handleTelemetryReport = (event: IpcMainEvent, input: unknown): void => {
    if (!isSender(event, options.getDesktopWebContents())) {
      return;
    }

    try {
      options.telemetryHub.applyReport(parseDebugTelemetryReport(input));
    } catch (error: unknown) {
      console.warn("Rejected an invalid debug telemetry report.", error);
    }
  };
  const unsubscribeTelemetry = options.telemetryHub.subscribe((state) => {
    const debugWebContents = options.getDebugWebContents();

    if (debugWebContents && !debugWebContents.isDestroyed()) {
      debugWebContents.send(IPC_CHANNELS.debugStateChanged, state);
    }
  });

  ipcMain.handle(IPC_CHANNELS.debugCloseWindow, handleCloseWindow);
  ipcMain.handle(IPC_CHANNELS.debugGetState, handleGetState);
  ipcMain.handle(IPC_CHANNELS.debugClearLogs, handleClearLogs);
  ipcMain.handle(IPC_CHANNELS.debugEmitAgentEvent, handleEmitAgentEvent);
  ipcMain.handle(IPC_CHANNELS.debugMinimizeWindow, handleMinimizeWindow);
  ipcMain.on(IPC_CHANNELS.debugTelemetryReport, handleTelemetryReport);

  return () => {
    unsubscribeTelemetry();
    ipcMain.removeHandler(IPC_CHANNELS.debugCloseWindow);
    ipcMain.removeHandler(IPC_CHANNELS.debugGetState);
    ipcMain.removeHandler(IPC_CHANNELS.debugClearLogs);
    ipcMain.removeHandler(IPC_CHANNELS.debugEmitAgentEvent);
    ipcMain.removeHandler(IPC_CHANNELS.debugMinimizeWindow);
    ipcMain.removeListener(
      IPC_CHANNELS.debugTelemetryReport,
      handleTelemetryReport,
    );
  };
}

function assertSender(
  event: IpcMainInvokeEvent,
  expected: WebContents | undefined,
): void {
  if (!isSender(event, expected)) {
    throw new Error("The debug IPC sender is not authorized.");
  }
}

function isSender(
  event: IpcMainEvent | IpcMainInvokeEvent,
  expected: WebContents | undefined,
): boolean {
  return (
    expected !== undefined &&
    !expected.isDestroyed() &&
    event.sender === expected &&
    event.senderFrame === expected.mainFrame
  );
}
