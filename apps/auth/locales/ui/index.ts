import { uiEn, type UiDict } from "./en";
import { uiPt } from "./pt";

export type AuthLocale = "en" | "pt";
export type { UiDict };

export const UI_DICTS: Record<AuthLocale, UiDict> = {
  en: uiEn,
  pt: uiPt,
};

export { uiEn, uiPt };
