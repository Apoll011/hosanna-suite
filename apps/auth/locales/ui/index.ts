import type { Language } from "@hosanna/i18n";
import { en } from "./en";
import { es } from "./es";
import { pt } from "./pt";

export const MESSAGES: Record<Language, typeof pt> = { pt, en, es };
export { en, es, pt };
