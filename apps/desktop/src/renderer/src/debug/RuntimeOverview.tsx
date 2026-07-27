import type { DebugRuntimeSnapshot } from "@asteria/shared/debug-contract";

import type { DebugLocale } from "./i18n.js";
import { DEBUG_COPY } from "./i18n.js";

export interface RuntimeOverviewProps {
  readonly locale: DebugLocale;
  readonly runtime: DebugRuntimeSnapshot | null;
}

export function RuntimeOverview({
  locale,
  runtime,
}: RuntimeOverviewProps): React.JSX.Element {
  const copy = DEBUG_COPY[locale];
  const rows = [
    [copy.runtime, runtime?.status ?? "—"],
    [copy.petState, runtime?.petState ?? "—"],
    [copy.activeAction, runtime?.activeAction ?? "—"],
    [copy.eventsProcessed, String(runtime?.eventsProcessed ?? 0)],
    [copy.lastEvent, runtime?.lastEvent?.type ?? "—"],
    [copy.source, runtime?.lastEvent?.source ?? "—"],
  ] as const;

  return (
    <section className="runtime-overview" aria-labelledby="runtime-heading">
      <h2 id="runtime-heading">{copy.runtimeOverview}</h2>
      <dl>
        {rows.map(([label, value]) => (
          <div className="runtime-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
