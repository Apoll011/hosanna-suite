/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Supported UI languages (short codes). */
export type Language = "pt" | "en" | "es";

/**
 * User preference for language. `"auto"` means "follow the organisation,
 * otherwise the browser, otherwise the default (`pt`)".
 */
export type PersonalLanguage = Language | "auto";

/** A plural leaf keyed by `one` / `other`. */
export type PluralMessage = { one: string; other: string };

/** A leaf value is a string or a plural; intermediate nodes are nested dicts. */
export type MessageDict = {
  [key: string]: string | PluralMessage | MessageDict;
};

/** Locale tag used by `Intl`/`toLocale*` for a given UI language. */
export const LANGUAGE_LOCALE: Record<Language, string> = {
  pt: "pt-PT",
  en: "en-US",
  es: "es-ES",
};

/* ------------------------------------------------------------------ */
/* Key derivation helpers — the `pt` dictionary is the source of truth. */
/* ------------------------------------------------------------------ */

type ExtractString<T> = Extract<T, string>;

/** All dot-paths in `T` that resolve to a translatable string leaf. */
type LeafKeys<T> = {
  [K in keyof T]-?: T[K] extends string
    ? K & string
    : T[K] extends PluralMessage
      ? `${K & string}.one` | `${K & string}.other`
      : T[K] extends object
        ? `${K & string}.${ExtractString<LeafKeys<T[K]>>}`
        : never;
}[keyof T];

/** All dot-paths in `T` that resolve to a plural (`{ one, other }`) node. */
type PluralKeys<T> = {
  [K in keyof T]-?: T[K] extends PluralMessage
    ? K & string
    : T[K] extends object
      ? `${K & string}.${ExtractString<PluralKeys<T[K]>>}`
      : never;
}[keyof T];

/** All valid `t()` keys for a given dictionary shape. */
export type TranslationKeyOf<T> = ExtractString<LeafKeys<T>>;
/** All valid `tc()` (plural) keys for a given dictionary shape. */
export type TranslationPluralKeyOf<T> = ExtractString<PluralKeys<T>>;
