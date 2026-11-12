export { DEFAULT_LANGUAGE, getLanguageMeta, LANGUAGES, type LanguageMeta } from "./languages";
export { deepMerge } from "./merge";
export { sharedMessages, sharedEn, sharedEs, sharedPt } from "./messages";
export { localeToLanguage, resolveLanguage } from "./resolve";
export { interpolate, lookup, resolveString, type Interpolation } from "./translate";
export {
  billingPeriodLabel,
  isPlanPeriodId,
  type PlanPeriodId,
} from "./billing";
export {
  LANGUAGE_LOCALE,
  type Language,
  type MessageDict,
  type PersonalLanguage,
  type PluralMessage,
  type TranslationKeyOf,
  type TranslationPluralKeyOf,
} from "./types";
