"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANG_COOKIE, LANG_STORAGE_KEY, dictionaries, isLang, pickText, translate, type DictKey, type Lang } from "./index";
import type { LText } from "@/lib/types";
import { ERROR_CODES, type ErrorCode } from "@/lib/errors";
import { DEFAULT_LANG } from "@/lib/types";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import type { Dict } from "./en";

type Params = Record<string, string | number>;

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey, params?: Params) => string;
  text: (value: LText) => string;
  errorText: (code: unknown) => string;
  money: (amount: number) => string;
  date: (iso: string) => string;
  currency: string;
  dict: Dict;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function persistLang(lang: Lang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* storage may be unavailable (private mode); cookie still persists it */
  }
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
}

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Restore the locally saved preference (it can only differ from the cookie
  // if the cookie was cleared), without causing a hydration mismatch.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(saved) && saved !== lang) {
        setLangState(saved);
        persistLang(saved);
      } else {
        document.documentElement.lang = lang;
      }
    } catch {
      document.documentElement.lang = lang;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persistLang(next);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: DictKey, params?: Params) => translate(lang, key, params);
    return {
      lang,
      setLang,
      t,
      text: (v: LText) => pickText(v, lang),
      errorText: (code: unknown) => {
        const safe: ErrorCode = (ERROR_CODES as readonly string[]).includes(code as string) ? (code as ErrorCode) : "generic";
        return translate(lang, `err.${safe}`);
      },
      money: (amount: number) => formatMoney(amount),
      date: (iso: string) => formatDate(iso),
      currency: dictionaries[lang].common.currency,
      dict: dictionaries[lang],
    };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}

export { DEFAULT_LANG };
