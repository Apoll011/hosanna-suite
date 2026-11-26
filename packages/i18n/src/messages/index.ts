/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Language } from "../types";
import { sharedEn } from "./en";
import { sharedEs } from "./es";
import { sharedPt } from "./pt";

export { sharedEn, sharedEs, sharedPt };

export const sharedMessages: Record<Language, typeof sharedPt> = {
  pt: sharedPt,
  en: sharedEn,
  es: sharedEs,
};
