import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { WindowPosition } from "./window-position.js";

/** Current on-disk window state schema version. */
export const WINDOW_STATE_VERSION = 1 as const;

/** Persisted desktop window state. */
export interface WindowState {
  readonly version: typeof WINDOW_STATE_VERSION;
  readonly position: WindowPosition;
  readonly clickThrough: boolean;
}

/**
 * Creates a validated version 1 window state value.
 */
export function createWindowState(
  position: WindowPosition,
  clickThrough = false,
): WindowState {
  const state: WindowState = {
    version: WINDOW_STATE_VERSION,
    position: { ...position },
    clickThrough,
  };

  if (!isWindowState(state)) {
    throw new TypeError("The window state is invalid.");
  }

  return state;
}

/**
 * Returns whether an unknown value exactly matches the version 1 window state
 * schema.
 */
export function isWindowState(value: unknown): value is WindowState {
  if (!isExactObject(value, ["clickThrough", "position", "version"])) {
    return false;
  }

  return (
    value.version === WINDOW_STATE_VERSION &&
    typeof value.clickThrough === "boolean" &&
    isWindowPosition(value.position)
  );
}

/**
 * Persists versioned window state as UTF-8 JSON using serialized atomic writes.
 */
export class WindowStateStore {
  readonly #fallbackState: WindowState;
  readonly #filePath: string;
  #disposed = false;
  #temporaryFileSequence = 0;
  #writeTail: Promise<void> = Promise.resolve();

  constructor(filePath: string, fallbackState: WindowState) {
    if (!isWindowState(fallbackState)) {
      throw new TypeError("The fallback window state is invalid.");
    }

    this.#filePath = filePath;
    this.#fallbackState = cloneWindowState(fallbackState);
  }

  /**
   * Loads persisted state, falling back when the file is absent, unreadable, or
   * contains invalid JSON or an unsupported schema version.
   */
  async load(): Promise<WindowState> {
    this.#assertActive();
    await this.flush().catch(() => undefined);

    try {
      const content = await readFile(this.#filePath, { encoding: "utf8" });
      const value: unknown = JSON.parse(content);

      return isWindowState(value)
        ? cloneWindowState(value)
        : cloneWindowState(this.#fallbackState);
    } catch {
      return cloneWindowState(this.#fallbackState);
    }
  }

  /**
   * Queues an atomic state write. Writes execute in invocation order so an
   * older write cannot replace a newer one.
   */
  save(state: WindowState): Promise<void> {
    this.#assertActive();

    if (!isWindowState(state)) {
      return Promise.reject(new TypeError("The window state is invalid."));
    }

    const snapshot = cloneWindowState(state);
    const operation = this.#writeTail
      .catch(() => undefined)
      .then(() => this.#writeAtomically(snapshot));

    this.#writeTail = operation;
    return operation;
  }

  /**
   * Waits until all writes queued before this call have settled.
   */
  async flush(): Promise<void> {
    await this.#writeTail;
  }

  /**
   * Prevents future loads and writes after flushing all queued writes.
   */
  async dispose(): Promise<void> {
    if (this.#disposed) {
      await this.flush();
      return;
    }

    this.#disposed = true;
    await this.flush();
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw new Error("The window state store has been disposed.");
    }
  }

  async #writeAtomically(state: WindowState): Promise<void> {
    await mkdir(dirname(this.#filePath), { recursive: true });

    const temporaryPath = `${this.#filePath}.${process.pid}.${Date.now()}.${this.#temporaryFileSequence++}.tmp`;
    const serializedState = `${JSON.stringify(state, undefined, 2)}\n`;

    try {
      await writeFile(temporaryPath, serializedState, {
        encoding: "utf8",
        flag: "wx",
      });
      await rename(temporaryPath, this.#filePath);
    } catch (error) {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }
}

function cloneWindowState(state: WindowState): WindowState {
  return {
    version: WINDOW_STATE_VERSION,
    position: { ...state.position },
    clickThrough: state.clickThrough,
  };
}

function isWindowPosition(value: unknown): value is WindowPosition {
  return (
    isExactObject(value, ["x", "y"]) &&
    typeof value.x === "number" &&
    Number.isInteger(value.x) &&
    typeof value.y === "number" &&
    Number.isInteger(value.y)
  );
}

function isExactObject(
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  );
}
