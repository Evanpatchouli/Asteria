import type { DebugTelemetryState } from "@asteria/shared/debug-contract";
import type { AgentEventType } from "@asteria/shared/event-contract";
import { useCallback, useEffect, useState } from "react";

export interface DebugTelemetryViewModel {
  readonly clearLogs: () => Promise<void>;
  readonly emitAgentEvent: (type: AgentEventType) => Promise<void>;
  readonly pendingEventType: AgentEventType | null;
  readonly state: DebugTelemetryState | null;
}

/**
 * Subscribes to Main-owned diagnostics and exposes stable UI actions.
 */
export function useDebugTelemetry(): DebugTelemetryViewModel {
  const [state, setState] = useState<DebugTelemetryState | null>(null);
  const [pendingEventType, setPendingEventType] =
    useState<AgentEventType | null>(null);

  useEffect(() => {
    let active = true;
    const applyState = (nextState: DebugTelemetryState): void => {
      if (!active) {
        return;
      }

      setState((currentState) =>
        currentState === null || nextState.sequence >= currentState.sequence
          ? nextState
          : currentState,
      );
    };
    const unsubscribe = window.debugApi.onStateChanged(applyState);

    void window.debugApi.getState().then(applyState).catch(console.error);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const clearLogs = useCallback(async (): Promise<void> => {
    await window.debugApi.clearLogs();
  }, []);
  const emitAgentEvent = useCallback(
    async (type: AgentEventType): Promise<void> => {
      setPendingEventType(type);

      try {
        await window.debugApi.emitAgentEvent({ type });
      } finally {
        setPendingEventType(null);
      }
    },
    [],
  );

  return {
    clearLogs,
    emitAgentEvent,
    pendingEventType,
    state,
  };
}
