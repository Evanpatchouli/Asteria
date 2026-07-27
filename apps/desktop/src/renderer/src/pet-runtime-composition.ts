import { InMemoryEventBus, type EventHandlerError } from "@asteria/event-bus";
import {
  PetRuntime,
  type PetRuntimeSnapshot,
  type RuntimeScheduler,
} from "@asteria/pet-runtime";
import { loadPixiPetPackage, PixiPetRenderer } from "@asteria/renderer";
import {
  type DebugLogInput,
  type DebugRuntimeSnapshot,
} from "@asteria/shared/debug-contract";
import {
  AGENT_EVENT_TYPES,
  type AgentEvent,
} from "@asteria/shared/event-contract";

export interface PetRuntimeComposition {
  readonly ready: Promise<void>;
  destroy(): void;
}

/**
 * Creates the desktop Renderer composition root for Agent Events, Pet Runtime,
 * and PixiJS.
 */
export function createPetRuntimeComposition(
  host: HTMLElement,
): PetRuntimeComposition {
  const eventBus = new InMemoryEventBus({
    onHandlerError: reportHandlerError,
  });
  let destroyed = false;
  let eventsProcessed = 0;
  let lastEvent: AgentEvent | null = null;
  let previousRuntimeSnapshot: PetRuntimeSnapshot | undefined;
  let runtime: PetRuntime | undefined;
  let unsubscribeRuntime = (): void => {};

  const ready = initializeRuntime();
  const unsubscribeBus = AGENT_EVENT_TYPES.map((type) =>
    eventBus.on(type, async (event) => {
      reportLog({
        detail: {
          en: `Received ${event.type} from ${event.source}`,
          zh: `收到 ${event.source} 发送的 ${event.type}`,
        },
        event: "event.received",
        level: "info",
        stage: "event-bus",
      });

      await ready;

      if (destroyed || !runtime) {
        return;
      }

      const transition = runtime.dispatch(event);

      eventsProcessed += 1;
      lastEvent = event;
      reportRuntimeSnapshot(runtime.snapshot(), eventsProcessed, lastEvent);

      if (transition.status === "changed") {
        reportLog({
          detail: {
            en: `${transition.from} -> ${transition.to}`,
            zh: `${transition.from} → ${transition.to}`,
          },
          event: "state.changed",
          level: "info",
          stage: "runtime",
        });
      } else {
        reportLog({
          detail: {
            en: `Kept ${transition.state}: ${transition.reason}`,
            zh: `保持 ${transition.state}：${transition.reason}`,
          },
          event: "state.unchanged",
          level: "info",
          stage: "runtime",
        });
      }

      reportLog({
        detail: {
          en: `Processed ${event.type}`,
          zh: `已处理 ${event.type}`,
        },
        event: "event.processed",
        level: "info",
        stage: "event-bus",
      });
    }),
  );
  const unsubscribeAgentEvents = window.desktopApi.onAgentEvent((event) => {
    void eventBus.emit(event);
  });

  return {
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      unsubscribeAgentEvents();

      for (const unsubscribe of unsubscribeBus) {
        unsubscribe();
      }

      runtime?.destroy();
      unsubscribeRuntime();
    },
    ready,
  };

  async function initializeRuntime(): Promise<void> {
    const petPackage = await loadPixiPetPackage("./lumi/pet.json");

    if (destroyed) {
      petPackage.destroy();
      return;
    }

    const renderer = new PixiPetRenderer({
      host,
      package: petPackage,
    });
    const nextRuntime = new PetRuntime({
      renderer,
      scheduler: createBrowserScheduler(),
      stateActions: {
        coding: petPackage.manifest.states.coding,
        error: petPackage.manifest.states.error,
        happy: petPackage.manifest.states.happy,
        idle: petPackage.manifest.states.idle,
        thinking: petPackage.manifest.states.thinking,
        tooling: petPackage.manifest.states.tooling,
      },
      transientStateDurationsMs: {
        error: 2_400,
        happy: 2_400,
      },
    });

    runtime = nextRuntime;
    unsubscribeRuntime = nextRuntime.subscribe((snapshot) => {
      reportRuntimeChanges(previousRuntimeSnapshot, snapshot);
      previousRuntimeSnapshot = snapshot;
      reportRuntimeSnapshot(snapshot, eventsProcessed, lastEvent);
    });

    try {
      await nextRuntime.initialize();
    } catch (error: unknown) {
      nextRuntime.destroy();
      runtime = undefined;
      unsubscribeRuntime();
      unsubscribeRuntime = (): void => {};
      throw error;
    }
  }
}

function createBrowserScheduler(): RuntimeScheduler {
  return {
    schedule(delayMs, task) {
      const timeout = window.setTimeout(task, delayMs);
      let scheduled = true;

      return () => {
        if (!scheduled) {
          return;
        }

        scheduled = false;
        window.clearTimeout(timeout);
      };
    },
  };
}

function reportRuntimeChanges(
  previous: PetRuntimeSnapshot | undefined,
  current: PetRuntimeSnapshot,
): void {
  if (previous?.status !== current.status) {
    reportLog({
      detail: {
        en: `Runtime status: ${current.status}`,
        zh: `运行时状态：${current.status}`,
      },
      event: `runtime.${current.status}`,
      level: "info",
      stage: "runtime",
    });
  }

  if (previous && previous.state !== current.state) {
    reportLog({
      detail: {
        en: `${previous.state} -> ${current.state}`,
        zh: `${previous.state} → ${current.state}`,
      },
      event: "runtime.state",
      level: "info",
      stage: "runtime",
    });
  }
}

function reportRuntimeSnapshot(
  snapshot: PetRuntimeSnapshot,
  eventsProcessed: number,
  lastEvent: AgentEvent | null,
): void {
  const debugSnapshot: DebugRuntimeSnapshot = {
    activeAction: snapshot.action,
    eventsProcessed,
    lastEvent,
    petState: snapshot.state,
    status: snapshot.status,
  };

  window.debugTelemetryApi.report({
    kind: "runtime",
    snapshot: debugSnapshot,
  });
}

function reportHandlerError(failure: EventHandlerError): void {
  reportLog({
    detail: {
      en: `Failed to process ${failure.event.type}: ${formatError(failure.error)}`,
      zh: `处理 ${failure.event.type} 失败：${formatError(failure.error)}`,
    },
    event: "event.failed",
    level: "error",
    stage: "event-bus",
  });
}

function reportLog(log: DebugLogInput): void {
  window.debugTelemetryApi.report({
    kind: "log",
    log,
  });
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
