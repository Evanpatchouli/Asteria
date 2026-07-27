import type { BrowserWindowConstructorOptions } from "electron";

export const DESKTOP_WINDOW_SIZE = {
  height: 360,
  width: 360,
} as const;

/**
 * Creates the BrowserWindow options for the desktop companion surface.
 *
 * Keeping this function pure makes security- and presentation-critical
 * options independently testable without starting Electron.
 */
export function createDesktopWindowOptions(
  preloadPath: string,
): BrowserWindowConstructorOptions {
  return {
    ...DESKTOP_WINDOW_SIZE,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    frame: false,
    hasShadow: false,
    resizable: false,
    show: false,
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
    },
  };
}
