"use client";

import { LANGS } from "@/lib/types";
import { useLang } from "@/i18n/LanguageProvider";

/** Visible UZ | RU | EN selector. Changing it re-translates the whole page instantly. */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="seg" role="group" aria-label={t("nav.language")}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          lang={code}
          onClick={() => setLang(code)}
          title={code.toUpperCase()}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
