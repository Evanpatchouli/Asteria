import type { DebugLocale } from "./i18n.js";

export interface LanguageSwitchProps {
  readonly locale: DebugLocale;
  readonly onChange: (locale: DebugLocale) => void;
}

export function LanguageSwitch({
  locale,
  onChange,
}: LanguageSwitchProps): React.JSX.Element {
  return (
    <div className="language-switch" aria-label="Language">
      <button
        className={locale === "zh" ? "is-selected" : undefined}
        onClick={() => {
          onChange("zh");
        }}
        type="button"
      >
        中文
      </button>
      <button
        className={locale === "en" ? "is-selected" : undefined}
        onClick={() => {
          onChange("en");
        }}
        type="button"
      >
        EN
      </button>
    </div>
  );
}
