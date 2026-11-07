/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseChordPro } from "@hosanna/chordpro";
import type { Song } from "../../../types";
import { injectChordProDirective } from "./chordProMeta";
import type { LibraryHealthAutoFix } from "./types";

/**
 * Fill a missing `{key:}` directive from `song.analyze().detectedKey`
 * (or declared analyze().key if somehow present without a directive match).
 */
export const keyAutoFix: LibraryHealthAutoFix = {
  id: "fill-detected-key",
  criterion: "key",

  canFix(song: Song): boolean {
    const ast = parseChordPro(song.content || "");
    if (ast.metadata.key?.trim()) return false;
    const analysis = ast.analyze();
    return Boolean(analysis.detectedKey?.trim() || analysis.key?.trim());
  },

  apply(song: Song) {
    const content = song.content || "";
    const ast = parseChordPro(content);
    if (ast.metadata.key?.trim()) return null;

    const analysis = ast.analyze();
    const key = (analysis.detectedKey || analysis.key || "").trim();
    if (!key) return null;

    const next = injectChordProDirective(content, "key", key);
    if (next === content) return null;
    return { content: next };
  },
};
