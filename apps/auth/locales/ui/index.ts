import { deepMerge, sharedMessages, type Language } from "@hosanna/i18n";
import { logosAiMessages } from "@hosanna/logos-ai/i18n";
import { en as enApp } from "./en";
import { es as esApp } from "./es";
import { pt as ptApp } from "./pt";

/** Shared brand/common/suite + Logos chat + auth-app overlays/settings. */
export const pt = deepMerge(sharedMessages.pt, logosAiMessages.pt, ptApp);
export const en = deepMerge(sharedMessages.en, logosAiMessages.en, enApp);
export const es = deepMerge(sharedMessages.es, logosAiMessages.es, esApp);

export const MESSAGES: Record<Language, typeof pt> = { pt, en, es };
