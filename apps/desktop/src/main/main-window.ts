import { BrowserWindow } from "electron";

import { createDesktopWindowOptions } from "./window-options.js";

export type RendererTarget =
  | {
      kind: "file";
      path: string;
    }
  | {
      kind: "url";
      url: string;
    };

export interface MainWindowHandle {
  readonly ready: Promise<void>;
  readonly window: BrowserWindow;
}

/**
 * Creates the desktop companion window and starts loading its Renderer entry.
 */
export function createMainWindow(
  preloadPath: string,
  rendererTarget: RendererTarget,
): MainWindowHandle {
  const window = new BrowserWindow(createDesktopWindowOptions(preloadPath));

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
