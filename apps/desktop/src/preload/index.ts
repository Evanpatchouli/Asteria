import { contextBridge, ipcRenderer } from "electron";

import { createDesktopApi } from "./desktop-api.js";

const desktopApi = createDesktopApi({
  on(channel, listener) {
    ipcRenderer.on(channel, listener);
  },
  removeListener(channel, listener) {
    ipcRenderer.removeListener(channel, listener);
  },
});

contextBridge.exposeInMainWorld("desktopApi", desktopApi);
