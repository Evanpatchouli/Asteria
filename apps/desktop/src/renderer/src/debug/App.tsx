import { useEffect, useState } from "react";

import { EventLog } from "./EventLog.js";
import { EventSimulator } from "./EventSimulator.js";
import {
  DEBUG_COPY,
  getInitialDebugLocale,
  saveDebugLocale,
  type DebugLocale,
} from "./i18n.js";
import { LanguageSwitch } from "./LanguageSwitch.js";
import { RuntimeOverview } from "./RuntimeOverview.js";
import { useDebugTelemetry } from "./use-debug-telemetry.js";
import { WindowControls } from "./WindowControls.js";

export function DebugApp(): React.JSX.Element {
  const [locale, setLocale] = useState<DebugLocale>(getInitialDebugLocale);
  const { clearLogs, emitAgentEvent, pendingEventType, state } =
    useDebugTelemetry();
  const copy = DEBUG_COPY[locale];

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    saveDebugLocale(locale);
  }, [locale]);

  return (
    <main className="debug-console">
      <header className="debug-header">
        <h1>{copy.title}</h1>
        <div className="header-controls">
          <LanguageSwitch locale={locale} onChange={setLocale} />
          <div
            className={`connection-status ${
              state?.connected ? "is-connected" : ""
            }`}
            role="status"
          >
            <span aria-hidden="true" />
            {state?.connected ? copy.connected : copy.disconnected}
          </div>
          <WindowControls locale={locale} />
        </div>
      </header>
      <div className="debug-workspace">
        <RuntimeOverview locale={locale} runtime={state?.runtime ?? null} />
        <EventSimulator
          activeEventType={
            pendingEventType ?? state?.runtime.lastEvent?.type ?? null
          }
          disabled={!state?.connected || pendingEventType !== null}
          locale={locale}
          onEmit={emitAgentEvent}
        />
      </div>
      <EventLog
        entries={state?.logs ?? []}
        locale={locale}
        onClear={clearLogs}
      />
    </main>
  );
}
