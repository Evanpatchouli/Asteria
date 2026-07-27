import {
  AGENT_EVENT_TYPES,
  type AgentEventType,
} from "@asteria/shared/event-contract";

import type { DebugLocale } from "./i18n.js";
import { DEBUG_COPY, EVENT_BUTTON_LABELS } from "./i18n.js";

export interface EventSimulatorProps {
  readonly activeEventType: AgentEventType | null;
  readonly disabled: boolean;
  readonly locale: DebugLocale;
  readonly onEmit: (type: AgentEventType) => Promise<void>;
}

export function EventSimulator({
  activeEventType,
  disabled,
  locale,
  onEmit,
}: EventSimulatorProps): React.JSX.Element {
  return (
    <section className="event-simulator" aria-labelledby="simulator-heading">
      <h2 id="simulator-heading">{DEBUG_COPY[locale].eventSimulator}</h2>
      <div className="event-button-grid">
        {AGENT_EVENT_TYPES.map((type) => (
          <button
            className={activeEventType === type ? "is-active" : undefined}
            disabled={disabled}
            key={type}
            onClick={() => {
              void onEmit(type).catch(console.error);
            }}
            type="button"
          >
            {EVENT_BUTTON_LABELS[locale][type]}
          </button>
        ))}
      </div>
    </section>
  );
}
