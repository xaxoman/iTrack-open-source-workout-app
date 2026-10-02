import { useMemo } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { en } from './en';
import { it } from './it';

export type Lang = 'en' | 'it';
export type LanguagePref = 'system' | Lang;

const dictionaries: Record<Lang, typeof en> = { en, it };

// Dot-separated paths to every string in the English dictionary.
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Leaves<typeof en>;
/** Keys that come in `_one` / `_other` pairs, without the suffix. */
export type TPluralKey = TKey extends infer K ? (K extends `${infer B}_one` ? B : never) : never;
export type Vars = Record<string, string | number>;

export function systemLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  return nav?.toLowerCase().startsWith('it') ? 'it' : 'en';
}

export function resolveLang(pref: LanguagePref | undefined): Lang {
  return !pref || pref === 'system' ? systemLang() : pref;
}

/** A valid BCP 47 tag, or the fallback (some systems report e.g. "en-US@posix"). */
function safeLocale(tag: string | undefined, fallback: string): string {
  if (!tag) return fallback;
  try {
    return Intl.getCanonicalLocales(tag.replace(/[@.].*$/, '').replace(/_/g, '-'))[0] ?? fallback;
  } catch {
    return fallback;
  }
}

/** BCP 47 locale used for dates and numbers. */
export function localeFor(lang: Lang): string {
  if (lang === 'it') return 'it-IT';
  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  // Keep the user's English variant (en-US, en-GB…); otherwise day-first English.
  return nav?.toLowerCase().startsWith('en') ? safeLocale(nav, 'en-GB') : 'en-GB';
}

function lookup(lang: Lang, key: string): string {
  const get = (dict: unknown) =>
    key.split('.').reduce<unknown>(
      (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
      dict
    );
  const value = get(dictionaries[lang]) ?? get(dictionaries.en);
  return typeof value === 'string' ? value : key;
}

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function translate(lang: Lang, key: TKey, vars?: Vars): string {
  return interpolate(lookup(lang, key), vars);
}

export function translatePlural(lang: Lang, base: TPluralKey, count: number, vars?: Vars): string {
  const key = `${base}_${count === 1 ? 'one' : 'other'}`;
  return interpolate(lookup(lang, key), { n: count, ...vars });
}

const capitalize = (s: string) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);

function build(lang: Lang) {
  const locale = localeFor(lang);
  const numberFormats = new Map<string, Intl.NumberFormat>();

  const number = (value: number, maxFractionDigits = 1, minFractionDigits = 0) => {
    const key = `${maxFractionDigits}|${minFractionDigits}`;
    let nf = numberFormats.get(key);
    if (!nf) {
      nf = new Intl.NumberFormat(locale, {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: minFractionDigits,
      });
      numberFormats.set(key, nf);
    }
    return nf.format(value);
  };

  const date = (value: Date | string | number, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(new Date(value));

  /** Weekday names Monday-first, e.g. narrow → ['M','T',…] / ['L','M',…]. */
  const weekdays = (style: 'narrow' | 'short' | 'long') => {
    // 2024-01-01 was a Monday.
    return Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(locale, { weekday: style }).format(new Date(2024, 0, 1 + i))
    );
  };

  const t = (key: TKey, vars?: Vars) => translate(lang, key, vars);
  const tp = (key: TPluralKey, count: number, vars?: Vars) => translatePlural(lang, key, count, vars);
  /** Translate a dynamic key (e.g. stored data), falling back to the given text. */
  const tx = (key: string, fallback: string) => {
    const value = lookup(lang, key);
    return value === key ? fallback : value;
  };
  /** Built-in muscle groups are stored in English; show them translated. */
  const muscle = (name: string) => tx(`muscles.${name.replace(/[^A-Za-z]/g, '')}`, name);

  /** 27:31 or 1:02:05 — a stopwatch-style duration. */
  const clock = (totalSeconds: number) => {
    const s = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
  };

  /** "11h 32m" / "47 min" style duration in words. */
  const duration = (totalSeconds: number) => {
    const minutes = Math.round(Math.max(0, totalSeconds) / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return t('time.hoursMinutes', { h, m });
    return t('time.minutes', { m });
  };

  return {
    lang,
    locale,
    t,
    tp,
    tx,
    muscle,
    number,
    date,
    weekdays,
    clock,
    duration,
    capitalize,
  };
}

export type I18n = ReturnType<typeof build>;

const cache = new Map<Lang, I18n>();
function forLang(lang: Lang): I18n {
  let i18n = cache.get(lang);
  if (!i18n) {
    i18n = build(lang);
    cache.set(lang, i18n);
  }
  return i18n;
}

/** Translations + locale formatters for the user's chosen language. */
export function useI18n(): I18n {
  const pref = useWorkoutStore((s) => s.language);
  const lang = resolveLang(pref);
  return useMemo(() => forLang(lang), [lang]);
}

/** Same as useI18n, for code outside React (notifications, toasts, prompts). */
export function getI18n(): I18n {
  return forLang(resolveLang(useWorkoutStore.getState().language));
}
