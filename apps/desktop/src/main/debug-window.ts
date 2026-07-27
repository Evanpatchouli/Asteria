import { BrowserWindow } from "electron";

import type { RendererTarget } from "./main-window.js";

export interface DebugWindowHandle {
  readonly ready: Promise<void>;
  readonly window: BrowserWindow;
}

/**
 * Creates the development-only diagnostics window.
 */
export function createDebugWindow(
  preloadPath: string,
  rendererTarget: RendererTarget,
): DebugWindowHandle {
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: "#111820",
    frame: false,
    height: 720,
    minHeight: 600,
    minWidth: 900,
    show: false,
    title: "Asteria Debug Console",
    webPreferences: {
      additionalArguments: ["--asteria-debug-window"],
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
    },
    width: 1120,
  });

  window.once("ready-to-show", () => {
    window.show();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  const ready =
    rendererTarget.kind === "url"
      ? window.loadURL(rendererTarget.url)
      : window.loadFile(rendererTarget.path);

  return {
    ready,
    window,
  };
}
