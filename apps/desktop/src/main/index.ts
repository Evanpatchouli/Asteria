import { app, BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createMainWindow,
  type MainWindowHandle,
  type RendererTarget,
} from "./main-window.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const isSmokeTest = process.argv.includes("--smoke-test");
const SMOKE_TEST_TIMEOUT_MS = 10_000;

let mainWindow: BrowserWindow | null = null;

function resolveRendererTarget(): RendererTarget {
  const developmentUrl = process.env["ELECTRON_RENDERER_URL"];

  if (!app.isPackaged && developmentUrl) {
    return {
      kind: "url",
      url: developmentUrl,
    };
  }

  return {
    kind: "file",
    path: join(currentDirectory, "../renderer/index.html"),
  };
}

function openMainWindow(): MainWindowHandle {
  const handle = createMainWindow(
    join(currentDirectory, "../preload/index.cjs"),
    resolveRendererTarget(),
  );

  mainWindow = handle.window;
  handle.window.once("closed", () => {
    mainWindow = null;
  });

  return handle;
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

void app
  .whenReady()
  .then(() => {
    const handle = openMainWindow();

    if (isSmokeTest) {
      return verifySmokeStartup(handle);
    }

    void handle.ready.catch((error: unknown) => {
      console.error("Failed to load the desktop Renderer.", error);
    });

    return undefined;
  })
  .catch((error: unknown) => {
    console.error("Failed to start the desktop application.", error);
    app.exit(1);
  });

app.on("activate", () => {
  if (
    !isSmokeTest &&
    mainWindow === null &&
    BrowserWindow.getAllWindows().length === 0
  ) {
    const handle = openMainWindow();
    void handle.ready.catch((error: unknown) => {
      console.error("Failed to reload the desktop Renderer.", error);
    });
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
