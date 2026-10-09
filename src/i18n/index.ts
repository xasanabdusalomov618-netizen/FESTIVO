// Translation runtime shared by server and client code.
import { DEFAULT_LANG, LANGS, type Lang, type LText } from "@/lib/types";
import { en, type Dict } from "./en";
import { ru } from "./ru";
import { uz } from "./uz";

export { LANGS, DEFAULT_LANG, type Lang, type LText };

export const LANG_COOKIE = "festivo_lang";
export const LANG_STORAGE_KEY = "festivo.lang";

export const dictionaries: Record<Lang, Dict> = { uz, ru, en };

/** Union of every dotted key path, e.g. "home.headline" or "plan.types.wedding". */
type Leaves<T, P extends string = ""> = T extends string
  ? P
  : { [K in keyof T & string]: Leaves<T[K], P extends "" ? K : `${P}.${K}`> }[keyof T & string];

export type DictKey = Leaves<Dict>;

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

export function resolveLang(value: unknown): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}

function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

/** Translates a key and fills {placeholders} from params. */
export function translate(lang: Lang, key: DictKey, params?: Record<string, string | number>): string {
  const raw = lookup(dictionaries[lang], key) ?? lookup(dictionaries[DEFAULT_LANG], key);
  if (raw === undefined) {
    if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing key "${key}" for ${lang}`);
    return key;
  }
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => (name in params ? String(params[name]) : `{${name}}`));
}

/** Picks the text for the active language from a multilingual field. */
export function pickText(text: LText, lang: Lang): string {
  return text[lang] || text[DEFAULT_LANG];
}
