import { type BrowserWindow, screen } from "electron";

import {
  calculateCenteredPosition,
  resolveWindowPosition,
  type WindowSize,
} from "./window-position.js";
import {
  createWindowState,
  type WindowState,
  type WindowStateStore,
} from "./window-state-store.js";

const POSITION_SAVE_DELAY_MS = 250;

export interface WindowControllerOptions {
  readonly initialState: WindowState;
  readonly onStateChange?: () => void;
  readonly stateStore: WindowStateStore;
  readonly window: BrowserWindow;
  readonly windowSize: WindowSize;
}

/**
 * Owns native desktop-window interaction state and persistence.
 */
export class WindowController {
  readonly #onStateChange: (() => void) | undefined;
  readonly #screen: typeof screen;
  readonly #stateStore: WindowStateStore;
  readonly #window: BrowserWindow;
  readonly #windowSize: WindowSize;
  #clickThrough: boolean;
  #disposed = false;
  #positionSaveTimer: NodeJS.Timeout | undefined;

  constructor(options: WindowControllerOptions) {
    this.#clickThrough = options.initialState.clickThrough;
    this.#onStateChange = options.onStateChange;
    this.#screen = screen;
    this.#stateStore = options.stateStore;
    this.#window = options.window;
    this.#windowSize = options.windowSize;

    this.#window.setIgnoreMouseEvents(this.#clickThrough, {
      forward: this.#clickThrough,
    });
    this.#window.on("move", this.#schedulePositionSave);
    this.#window.on("show", this.#notifyStateChange);
    this.#window.on("hide", this.#notifyStateChange);
    this.#screen.on("display-added", this.#handleDisplayChange);
    this.#screen.on("display-removed", this.#handleDisplayChange);
    this.#screen.on("display-metrics-changed", this.#handleDisplayChange);
  }

  /**
   * Returns whether the window currently ignores mouse input.
   */
  isClickThrough(): boolean {
    return this.#clickThrough;
  }

  /**
   * Returns whether the desktop window is currently visible.
   */
  isWindowVisible(): boolean {
    return !this.#window.isDestroyed() && this.#window.isVisible();
  }

  /**
   * Shows the window without taking focus from the active application.
   */
  showWindow(): void {
    if (!this.#window.isDestroyed() && !this.#window.isVisible()) {
      this.#window.showInactive();
    }
  }

  /**
   * Hides the window without destroying its runtime state.
   */
  hideWindow(): void {
    if (!this.#window.isDestroyed() && this.#window.isVisible()) {
      this.#window.hide();
    }
  }

  /**
   * Moves the window to the primary work area's center and reveals it without
   * taking focus from the active application.
   */
  centerWindow(): void {
    if (this.#disposed || this.#window.isDestroyed()) {
      return;
    }

    this.#clearPositionSaveTimer();

    const position = calculateCenteredPosition(
      this.#screen.getPrimaryDisplay().workArea,
      this.#windowSize,
    );

    this.#window.setPosition(position.x, position.y);

    if (!this.#window.isVisible()) {
      this.#window.showInactive();
    }

    void this.#persistCurrentState();
  }

  /**
   * Enables or disables whole-window mouse click-through.
   */
  setClickThrough(enabled: boolean): void {
    if (this.#disposed || this.#window.isDestroyed()) {
      return;
    }

    this.#clickThrough = enabled;
    this.#window.setIgnoreMouseEvents(enabled, {
      forward: enabled,
    });
    this.#notifyStateChange();
    void this.#persistCurrentState();
  }

  /**
   * Flushes window state and removes all native event listeners.
   */
  async dispose(): Promise<void> {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    this.#clearPositionSaveTimer();
    this.#window.removeListener("move", this.#schedulePositionSave);
    this.#window.removeListener("show", this.#notifyStateChange);
    this.#window.removeListener("hide", this.#notifyStateChange);
    this.#screen.removeListener("display-added", this.#handleDisplayChange);
    this.#screen.removeListener("display-removed", this.#handleDisplayChange);
    this.#screen.removeListener(
      "display-metrics-changed",
      this.#handleDisplayChange,
    );

    await this.#persistCurrentState();
    await this.#stateStore.dispose().catch((error: unknown) => {
      console.warn("Failed to dispose the window state store.", error);
    });
  }

  readonly #notifyStateChange = (): void => {
    this.#onStateChange?.();
  };

  readonly #schedulePositionSave = (): void => {
    if (this.#disposed) {
      return;
    }

    this.#clearPositionSaveTimer();
    this.#positionSaveTimer = setTimeout(() => {
      this.#positionSaveTimer = undefined;
      void this.#persistCurrentState();
    }, POSITION_SAVE_DELAY_MS);
  };

  readonly #handleDisplayChange = (): void => {
    if (this.#disposed || this.#window.isDestroyed()) {
      return;
    }

    const { x, y } = this.#window.getBounds();
    const position = resolveWindowPosition(
      { x, y },
      this.#windowSize,
      this.#screen.getAllDisplays(),
      this.#screen.getPrimaryDisplay(),
    );

    if (position.x !== x || position.y !== y) {
      this.#window.setPosition(position.x, position.y);
    }

    void this.#persistCurrentState();
  };

  #clearPositionSaveTimer(): void {
    if (this.#positionSaveTimer) {
      clearTimeout(this.#positionSaveTimer);
      this.#positionSaveTimer = undefined;
    }
  }

  async #persistCurrentState(): Promise<void> {
    if (this.#window.isDestroyed()) {
      return;
    }

    const { x, y } = this.#window.getBounds();

    await this.#stateStore
      .save(createWindowState({ x, y }, this.#clickThrough))
      .catch((error: unknown) => {
        console.warn("Failed to persist window state.", error);
      });
  }
}
