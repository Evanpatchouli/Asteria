import type {
  DebugLogInput,
  DebugRuntimeSnapshot,
  DebugTelemetryReport,
  DebugTelemetryState,
} from "@asteria/shared";

const MAXIMUM_LOG_ENTRIES = 200;

const INITIAL_RUNTIME_SNAPSHOT: DebugRuntimeSnapshot = {
  activeAction: null,
  eventsProcessed: 0,
  lastEvent: null,
  petState: "idle",
  status: "created",
};

export type DebugTelemetryObserver = (state: DebugTelemetryState) => void;

/**
 * Maintains bounded, process-local development diagnostics.
 */
export class DebugTelemetryHub {
  readonly #logs: DebugTelemetryState["logs"][number][] = [];
  readonly #observers = new Set<DebugTelemetryObserver>();
  #connected = false;
  #runtime: DebugRuntimeSnapshot = INITIAL_RUNTIME_SNAPSHOT;
  #sequence = 0;

  /** Returns an immutable copy of the latest diagnostics state. */
  public snapshot(): DebugTelemetryState {
    return {
      connected: this.#connected,
      logs: this.#logs.map((entry) => ({
        ...entry,
        detail: { ...entry.detail },
      })),
      runtime: {
        ...this.#runtime,
        lastEvent: this.#runtime.lastEvent
          ? { ...this.#runtime.lastEvent }
          : null,
      },
      sequence: this.#sequence,
    };
  }

  /**
   * Subscribes to complete state updates and immediately receives one.
   */
  public subscribe(observer: DebugTelemetryObserver): () => void {
    this.#observers.add(observer);
    this.#notifyObserver(observer);

    return () => {
      this.#observers.delete(observer);
    };
  }

  /** Applies one validated telemetry report from the desktop Renderer. */
  public applyReport(report: DebugTelemetryReport): void {
    if (report.kind === "log") {
      this.appendLog(report.log);
      return;
    }

    this.#runtime = report.snapshot;
    this.#connected = report.snapshot.status !== "destroyed";
    this.#commit();
  }

  /** Appends one structured log entry to the bounded history. */
  public appendLog(log: DebugLogInput): void {
    const sequence = this.#nextSequence();

    this.#logs.push({
      ...log,
      detail: { ...log.detail },
      sequence,
      timestamp: Date.now(),
    });

    if (this.#logs.length > MAXIMUM_LOG_ENTRIES) {
      this.#logs.splice(0, this.#logs.length - MAXIMUM_LOG_ENTRIES);
    }

    this.#notifyObservers();
  }

  /** Removes all retained log entries without resetting Runtime data. */
  public clearLogs(): void {
    this.#logs.splice(0);
    this.#commit();
  }

  /** Updates whether the desktop Runtime telemetry source is connected. */
  public setConnected(connected: boolean): void {
    if (this.#connected === connected) {
      return;
    }

    this.#connected = connected;
    this.#commit();
  }

  #commit(): void {
    this.#nextSequence();
    this.#notifyObservers();
  }

  #nextSequence(): number {
    this.#sequence += 1;
    return this.#sequence;
  }

  #notifyObservers(): void {
    for (const observer of this.#observers) {
      this.#notifyObserver(observer);
    }
  }

  #notifyObserver(observer: DebugTelemetryObserver): void {
    try {
      observer(this.snapshot());
    } catch {
      // Diagnostics observers must never affect the application runtime.
    }
  }
}
