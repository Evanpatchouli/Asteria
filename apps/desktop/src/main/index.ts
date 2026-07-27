import { app, screen, type BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDesktopTray, type DesktopTrayHandle } from "./desktop-tray.js";
import { registerDebugIpc } from "./debug-ipc.js";
import { DebugTelemetryHub } from "./debug-telemetry-hub.js";
import { createDebugWindow } from "./debug-window.js";
import {
  createMainWindow,
  type MainWindowHandle,
  type RendererTarget,
} from "./main-window.js";
import { WindowController } from "./window-controller.js";
import {
  calculateBottomRightPosition,
  resolveWindowPosition,
} from "./window-position.js";
import { createWindowState, WindowStateStore } from "./window-state-store.js";
import { DESKTOP_WINDOW_SIZE } from "./window-options.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const isSmokeTest = process.argv.includes("--smoke-test");
const isDevelopment =
  !app.isPackaged && Boolean(process.env["ELECTRON_RENDERER_URL"]);
const SMOKE_TEST_TIMEOUT_MS = 10_000;
const WINDOW_STATE_RELATIVE_PATH = join("asteria-data", "window-state.json");

let desktopTray: DesktopTrayHandle | null = null;
let debugIpcDispose: (() => void) | null = null;
const debugTelemetryHub = new DebugTelemetryHub();
let debugWindow: BrowserWindow | null = null;
let isQuitting = false;
let mainWindow: BrowserWindow | null = null;
let windowController: WindowController | null = null;

function resolveRendererTarget(entryFile = "index.html"): RendererTarget {
  const developmentUrl = process.env["ELECTRON_RENDERER_URL"];

  if (!app.isPackaged && developmentUrl) {
    const baseUrl = developmentUrl.endsWith("/")
      ? developmentUrl
      : `${developmentUrl}/`;

    return {
      kind: "url",
      url: new URL(entryFile, baseUrl).toString(),
    };
  }

  return {
    kind: "file",
    path: join(currentDirectory, "../renderer", entryFile),
  };
}

async function openMainWindow(): Promise<MainWindowHandle> {
  const primaryDisplay = screen.getPrimaryDisplay();
  const fallbackPosition = calculateBottomRightPosition(
    primaryDisplay.workArea,
    DESKTOP_WINDOW_SIZE,
  );
  const stateStore = new WindowStateStore(
    join(app.getPath("userData"), WINDOW_STATE_RELATIVE_PATH),
    createWindowState(fallbackPosition),
  );
  const savedState = await stateStore.load();
  const initialPosition = resolveWindowPosition(
    savedState.position,
    DESKTOP_WINDOW_SIZE,
    screen.getAllDisplays(),
    primaryDisplay,
  );
  const initialState = createWindowState(
    initialPosition,
    savedState.clickThrough,
  );

  await stateStore.save(initialState).catch((error: unknown) => {
    console.warn("Failed to normalize the saved window state.", error);
  });

  const handle = createMainWindow(
    join(currentDirectory, "../preload/index.cjs"),
    resolveRendererTarget(),
    initialPosition,
    isDevelopment,
  );
  const controller = new WindowController({
    initialState,
    onStateChange() {
      desktopTray?.refresh();
    },
    stateStore,
    window: handle.window,
    windowSize: DESKTOP_WINDOW_SIZE,
  });

  mainWindow = handle.window;
  windowController = controller;

  handle.window.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      controller.hideWindow();
    }
  });
  handle.window.once("closed", () => {
    if (isDevelopment) {
      debugTelemetryHub.setConnected(false);
    }

    mainWindow = null;
    windowController = null;
    void controller.dispose();
  });
  handle.window.webContents.on("render-process-gone", () => {
    if (isDevelopment) {
      debugTelemetryHub.setConnected(false);
    }
  });

  if (!isSmokeTest && desktopTray === null) {
    const icon = await app.getFileIcon(process.execPath, {
      size: "small",
    });
    desktopTray = createDesktopTray(icon, {
      centerWindow() {
        windowController?.centerWindow();
      },
      ...(isDevelopment
        ? {
            openDebugPanel() {
              showDebugPanel();
            },
          }
        : {}),
      hideWindow() {
        windowController?.hideWindow();
      },
      isClickThrough() {
        return windowController?.isClickThrough() ?? false;
      },
      isWindowVisible() {
        return windowController?.isWindowVisible() ?? false;
      },
      quitApplication() {
        void quitApplication();
      },
      setClickThrough(enabled) {
        windowController?.setClickThrough(enabled);
      },
      showWindow() {
        windowController?.showWindow();
      },
    });
  }

  return handle;
}

function showDebugPanel(): void {
  if (!isDevelopment || isQuitting) {
    return;
  }

  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.show();
    debugWindow.focus();
    return;
  }

  const handle = createDebugWindow(
    join(currentDirectory, "../preload/index.cjs"),
    resolveRendererTarget("debug.html"),
  );
  const openedWindow = handle.window;

  debugWindow = openedWindow;
  openedWindow.once("closed", () => {
    if (debugWindow === openedWindow) {
      debugWindow = null;
    }
  });
  void handle.ready.catch((error: unknown) => {
    console.error("Failed to load the debug Renderer.", error);

    if (!openedWindow.isDestroyed()) {
      openedWindow.destroy();
    }

    if (debugWindow === openedWindow) {
      debugWindow = null;
    }
  });
}

async function quitApplication(): Promise<void> {
  if (isQuitting) {
    return;
  }

  isQuitting = true;
  desktopTray?.destroy();
  desktopTray = null;
  debugIpcDispose?.();
  debugIpcDispose = null;

  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.destroy();
  }
  debugWindow = null;

  if (windowController) {
    await windowController.dispose();
  }

  app.quit();
}

async function verifySmokeStartup(handle: MainWindowHandle): Promise<void> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      handle.ready,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(
            new Error(
              `Renderer did not load within ${String(SMOKE_TEST_TIMEOUT_MS)} ms.`,
            ),
          );
        }, SMOKE_TEST_TIMEOUT_MS);
      }),
    ]);

    if (!handle.window.isAlwaysOnTop()) {
      throw new Error("Desktop window is not always on top.");
    }

    const isDesktopApiAvailable: unknown =
      await handle.window.webContents.executeJavaScript(
        "typeof window.desktopApi?.onAgentEvent === 'function'",
        true,
      );

    if (isDesktopApiAvailable !== true) {
      throw new Error("Preload desktop API is unavailable.");
    }

    console.info("Desktop smoke test passed.");
    app.exit(0);
  } catch (error) {
    console.error("Desktop smoke test failed.", error);
    app.exit(1);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function registerApplicationLifecycle(): void {
  app.on("second-instance", () => {
    windowController?.showWindow();
  });

  app.on("activate", () => {
    if (!isSmokeTest && mainWindow && !mainWindow.isDestroyed()) {
      windowController?.showWindow();
    }
  });

  app.on("before-quit", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      void quitApplication();
    }
  });

  void app
    .whenReady()
    .then(async () => {
      if (isDevelopment) {
        debugIpcDispose = registerDebugIpc({
          getDebugWebContents() {
            return debugWindow && !debugWindow.isDestroyed()
              ? debugWindow.webContents
              : undefined;
          },
          getDesktopWebContents() {
            return mainWindow && !mainWindow.isDestroyed()
              ? mainWindow.webContents
              : undefined;
          },
          telemetryHub: debugTelemetryHub,
        });
      }

      const handle = await openMainWindow();

      if (isSmokeTest) {
        return verifySmokeStartup(handle);
      }

      await handle.ready.catch((error: unknown) => {
        console.error("Failed to load the desktop Renderer.", error);
      });
    })
    .catch((error: unknown) => {
      console.error("Failed to start the desktop application.", error);
      app.exit(1);
    });
}

if (app.requestSingleInstanceLock()) {
  registerApplicationLifecycle();
} else {
  app.quit();
}
