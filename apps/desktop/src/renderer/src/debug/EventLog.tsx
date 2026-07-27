import type { DebugLogEntry } from "@asteria/shared/debug-contract";
import { useEffect, useRef } from "react";

import type { DebugLocale } from "./i18n.js";
import { DEBUG_COPY } from "./i18n.js";

export interface EventLogProps {
  readonly entries: readonly DebugLogEntry[];
  readonly locale: DebugLocale;
  readonly onClear: () => Promise<void>;
}

export function EventLog({
  entries,
  locale,
  onClear,
}: EventLogProps): React.JSX.Element {
  const copy = DEBUG_COPY[locale];
  const logBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const logBody = logBodyRef.current;

    if (logBody) {
      logBody.scrollTop = logBody.scrollHeight;
    }
  }, [entries.length]);

  return (
    <section className="event-log" aria-labelledby="log-heading">
      <div className="section-heading">
        <h2 id="log-heading">{copy.eventLog}</h2>
        <button
          className="clear-button"
          disabled={entries.length === 0}
          onClick={() => {
            void onClear().catch(console.error);
          }}
          type="button"
        >
          {copy.clearLog}
        </button>
      </div>
      <div className="log-table" role="table" aria-label={copy.eventLog}>
        <div className="log-row log-header" role="row">
          <span role="columnheader">{copy.time}</span>
          <span role="columnheader">{copy.stage}</span>
          <span role="columnheader">{copy.event}</span>
          <span role="columnheader">{copy.detail}</span>
        </div>
        <div className="log-body" ref={logBodyRef}>
          {entries.length === 0 ? (
            <p className="empty-log">{copy.emptyLog}</p>
          ) : (
            entries.map((entry) => (
              <div
                className={`log-row log-level-${entry.level}`}
                key={entry.sequence}
                role="row"
              >
                <span role="cell">{formatTime(entry.timestamp, locale)}</span>
                <span className="log-stage" role="cell">
                  {formatStage(entry.stage)}
                </span>
                <span role="cell">{entry.event}</span>
                <span className="log-detail" role="cell">
                  {entry.detail[locale]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function formatStage(stage: DebugLogEntry["stage"]): string {
  return stage.replace("-", " ").toUpperCase();
}

function formatTime(timestamp: number, locale: DebugLocale): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    fractionalSecondDigits: 3,
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}
