/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Language } from "@hosanna/i18n";
import { logosAiMessages as en } from "./en";
import { logosAiMessages as es } from "./es";
import { logosAiMessages as pt } from "./pt";

export { chat as chatEn, logosAiMessages as logosAiMessagesEn } from "./en";
export { chat as chatEs, logosAiMessages as logosAiMessagesEs } from "./es";
export { chat as chatPt, logosAiMessages as logosAiMessagesPt } from "./pt";

/** Package-owned Logos chat dictionaries keyed by UI language. */
export const logosAiMessages: Record<Language, typeof pt> = {
  pt,
  en,
  es,
};

export type LogosAiMessages = (typeof logosAiMessages)["pt"];
