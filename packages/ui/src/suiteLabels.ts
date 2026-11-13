/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Localize suite catalog DTOs using host `t()` against `@hosanna/i18n` keys
 * (`suite.apps.*`). Dictionaries live in the i18n package, not here.
 */

export type SuiteAppLocalizable = {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  nameKey?: string | null;
  shortNameKey?: string | null;
  descriptionKey?: string | null;
};

export type SuiteAppLabelField = "name" | "shortName" | "description";

type TranslateFn = (key: string) => string;

/** Resolve a catalog label via i18n key, falling back to the DTO English string. */
export function resolveSuiteAppLabel(
  app: SuiteAppLocalizable,
  t: TranslateFn,
  field: SuiteAppLabelField,
): string {
  const key =
    field === "name" ? app.nameKey : field === "shortName" ? app.shortNameKey : app.descriptionKey;
  const fallback =
    field === "name" ? app.name : field === "shortName" ? app.shortName : (app.description ?? "");
  if (!key) return fallback;
  const translated = t(key);
  return !translated || translated === key ? fallback : translated;
}

/** Return a copy of the app with name/shortName/description localized. */
export function localizeSuiteApp<T extends SuiteAppLocalizable>(app: T, t: TranslateFn): T {
  return {
    ...app,
    name: resolveSuiteAppLabel(app, t, "name"),
    shortName: resolveSuiteAppLabel(app, t, "shortName"),
    description: resolveSuiteAppLabel(app, t, "description"),
  };
}

export function localizeSuiteApps<T extends SuiteAppLocalizable>(apps: T[], t: TranslateFn): T[] {
  return apps.map((app) => localizeSuiteApp(app, t));
}
