import { contextBridge, ipcRenderer } from "electron";

import { createDebugApi } from "./debug-api.js";
import { createDesktopApi } from "./desktop-api.js";
import { createDebugTelemetryApi } from "./debug-telemetry-api.js";

const isDebugWindow = process.argv.includes("--asteria-debug-window");
const isDebugTelemetryEnabled = process.argv.includes(
  "--asteria-debug-telemetry",
);

if (isDebugWindow) {
  contextBridge.exposeInMainWorld(
    "debugApi",
    createDebugApi({
      invoke(channel, ...args) {
        return ipcRenderer.invoke(channel, ...args);
      },
      on(channel, listener) {
        ipcRenderer.on(channel, listener);
      },
      removeListener(channel, listener) {
        ipcRenderer.removeListener(channel, listener);
      },
    }),
  );
} else {
  const desktopApi = createDesktopApi({
    on(channel, listener) {
      ipcRenderer.on(channel, listener);
    },
    removeListener(channel, listener) {
      ipcRenderer.removeListener(channel, listener);
    },
  });

  contextBridge.exposeInMainWorld("desktopApi", desktopApi);
  contextBridge.exposeInMainWorld(
    "debugTelemetryApi",
    isDebugTelemetryEnabled
      ? createDebugTelemetryApi({
          send(channel, report) {
            ipcRenderer.send(channel, report);
          },
        })
      : {
          report() {
            // Production keeps the composition API stable without emitting IPC.
          },
        },
  );
}
