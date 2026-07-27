import type { BrowserWindowConstructorOptions, Point } from "electron";

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
  position?: Point,
  debugTelemetryEnabled = false,
): BrowserWindowConstructorOptions {
  return {
    ...DESKTOP_WINDOW_SIZE,
    ...(position ? position : {}),
    alwaysOnTop: true,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    frame: false,
    hasShadow: false,
    resizable: false,
    show: false,
    transparent: true,
    webPreferences: {
      ...(debugTelemetryEnabled
        ? { additionalArguments: ["--asteria-debug-telemetry"] }
        : {}),
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
    },
  };
}
