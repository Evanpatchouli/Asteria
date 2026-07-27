import { describe, expect, it } from "vitest";

import {
  createDesktopWindowOptions,
  DESKTOP_WINDOW_SIZE,
} from "./window-options.js";

describe("createDesktopWindowOptions", () => {
  it("creates a transparent frameless always-on-top window", () => {
    const options = createDesktopWindowOptions("C:\\app\\preload.js");

    expect(options).toMatchObject({
      ...DESKTOP_WINDOW_SIZE,
      alwaysOnTop: true,
      backgroundColor: "#00000000",
      frame: false,
      hasShadow: false,
      resizable: false,
      show: false,
      transparent: true,
    });
  });

  it("isolates the Renderer from Node and enables the sandbox", () => {
    const options = createDesktopWindowOptions("C:\\app\\preload.js");

    expect(options.webPreferences).toEqual({
      contextIsolation: true,
      nodeIntegration: false,
      preload: "C:\\app\\preload.js",
      sandbox: true,
    });
  });
});
