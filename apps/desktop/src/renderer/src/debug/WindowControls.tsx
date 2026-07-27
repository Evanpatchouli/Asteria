import type { DebugLocale } from "./i18n.js";
import { DEBUG_COPY } from "./i18n.js";

export interface WindowControlsProps {
  readonly locale: DebugLocale;
}

export function WindowControls({
  locale,
}: WindowControlsProps): React.JSX.Element {
  const copy = DEBUG_COPY[locale];

  return (
    <div className="window-controls">
      <button
        aria-label={copy.minimizeWindow}
        className="window-control"
        onClick={() => {
          void window.debugApi.minimizeWindow().catch(console.error);
        }}
        title={copy.minimizeWindow}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="M3 11.5h10" />
        </svg>
      </button>
      <button
        aria-label={copy.closeWindow}
        className="window-control window-control-close"
        onClick={() => {
          void window.debugApi.closeWindow().catch(console.error);
        }}
        title={copy.closeWindow}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16">
          <path d="m4 4 8 8m0-8-8 8" />
        </svg>
      </button>
    </div>
  );
}
