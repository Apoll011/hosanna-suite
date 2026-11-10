/**
 * Source-preserving ChordPro transposition.
 *
 * Rewrites chord brackets and key directives in the original text without
 * round-tripping through the AST, so lyrics, variants, comments, tabs, and
 * unknown directives stay intact.
 */

import { getNoteValue, transposeChord, transposeNote } from "@hosanna/chordpro/parser";

export type TransposeChordProSourceOptions =
  { semitones: number; toKey?: never } | { toKey: string; semitones?: never };

export interface TransposeChordProSourceResult {
  content: string;
  /** Applied interval. For toKey targets this is the shortest ascending shift (0–11). */
  semitones: number;
  /** Explicit direction of the applied interval. */
  direction: "up" | "down" | "none";
  fromKey: string | null;
  toKey: string | null;
}

function extractKeyDirective(source: string, names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(`\\{${name}:\\s*([^}]+)\\}`, "i");
    const match = source.match(re);
    if (match) return match[1].trim();
  }
  return null;
}

function getSemitonesBetween(fromNote: string, toNote: string): number {
  const from = getNoteValue(fromNote);
  const to = getNoteValue(toNote);
  if (from === undefined || to === undefined) return 0;
  return (to - from + 12) % 12;
}

function transposeKeyToken(token: string, semitones: number): string {
  const trimmed = token.trim();
  if (!trimmed) return token;

  // Preserve trailing mode/quality text after the root (e.g. "Am", "G major")
  const match = trimmed.match(
    /^([A-G][#b]?|Do|Ré|Mi|Fá|Sol|Lá|Si|DO|RE|RÉ|MI|FA|FÁ|SOL|LA|LÁ|SI)(.*)$/i,
  );
  if (!match) return token;

  const note = match[1];
  const suffix = match[2];
  const preferFlats = note.includes("b") || note.includes("B");
  return transposeNote(note, semitones, preferFlats) + suffix;
}

function rewriteKeyDirectives(source: string, semitones: number): string {
  if (semitones === 0) return source;
  return source.replace(
    /\{(key|k|original_key|original\s+key)\s*:\s*([^}]+)\}/gi,
    (_full, name: string, value: string) => {
      const transposed = transposeKeyToken(value, semitones);
      return `{${name}: ${transposed}}`;
    },
  );
}

function rewriteChordBrackets(source: string, semitones: number): string {
  if (semitones === 0) return source;
  return source.replace(/\[([^\]]+)\]/g, (_match, chord: string) => {
    return `[${transposeChord(chord, semitones)}]`;
  });
}

/**
 * Transpose a ChordPro source string by semitones or to a target key.
 * Preserves all non-chord content.
 */
export function transposeChordProSource(
  source: string,
  options: TransposeChordProSourceOptions | number,
): TransposeChordProSourceResult {
  const fromKey =
    extractKeyDirective(source, ["key", "k"]) ??
    extractKeyDirective(source, ["original_key", "original key"]);

  let semitones: number;
  let toKey: string | null = null;

  if (typeof options === "number") {
    semitones = options;
    toKey = fromKey ? transposeKeyToken(fromKey, semitones) : null;
  } else if ("toKey" in options && options.toKey) {
    toKey = options.toKey;
    if (!fromKey) {
      semitones = 0;
    } else {
      semitones = getSemitonesBetween(fromKey, options.toKey);
    }
  } else {
    semitones = options.semitones ?? 0;
    toKey = fromKey ? transposeKeyToken(fromKey, semitones) : null;
  }

  // Prefer shortest ascending interval (0..11) when targeting a key.
  // Explicit signed semitones keep the caller's direction.
  const ascending = ((semitones % 12) + 12) % 12;
  const usedToKey =
    typeof options !== "number" && "toKey" in options && Boolean(options.toKey);
  let applied: number;
  let direction: "up" | "down" | "none";
  if (usedToKey) {
    applied = ascending;
    direction = applied === 0 ? "none" : "up";
  } else if (typeof options === "number") {
    applied = options;
    direction = applied === 0 ? "none" : applied > 0 ? "up" : "down";
  } else {
    applied = options.semitones ?? 0;
    direction = applied === 0 ? "none" : applied > 0 ? "up" : "down";
  }

  let content = rewriteChordBrackets(source, applied);
  content = rewriteKeyDirectives(content, applied);

  // When targeting an explicit key, force {key:} to that exact spelling
  if (typeof options !== "number" && "toKey" in options && options.toKey) {
    if (/\{(?:key|k)\s*:/i.test(content)) {
      content = content.replace(/\{(key|k)\s*:\s*[^}]+\}/i, `{key: ${options.toKey}}`);
    }
  }

  return {
    content,
    semitones: applied,
    direction,
    fromKey,
    toKey:
      typeof options !== "number" && "toKey" in options && options.toKey ? options.toKey : toKey,
  };
}
