/**
 * Server-side i18n for transactional email templates.
 * Dictionaries live under `./email`.
 */

import en from "./email/en";
import es from "./email/es";
import type { I18nKeys } from "./email/pt-PT";
import ptPT from "./email/pt-PT";

const registry = new Map<string, Record<string, unknown>>();
registry.set("pt-PT", ptPT);
registry.set("pt-BR", ptPT);
registry.set("en-US", en);
registry.set("en", en);
registry.set("es-ES", es);
registry.set("es", es);

type DotPath<T, Prefix extends string = ""> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: DotPath<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
      }[keyof T & string]
    : Prefix;

export type TranslationKey = DotPath<I18nKeys>;

function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{{${key}}}`,
  );
}

export function t(
  locale: string,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const data = (registry.get(locale) ?? ptPT) as Record<string, unknown>;
  const raw = resolve(data, key) ?? resolve(ptPT as Record<string, unknown>, key) ?? key;
  return vars ? interpolate(raw, vars) : raw;
}

export const DEFAULT_LOCALE = "pt-PT";
