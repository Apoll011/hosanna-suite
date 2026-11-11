/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
