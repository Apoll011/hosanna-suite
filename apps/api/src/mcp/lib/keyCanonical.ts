import { getNoteValue } from "@hosanna/chordpro/parser";

/** Common enharmonic / preferred spellings for worship keys. */
const CANONICAL_KEYS = [
  "C",
  "C#",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
  "Cm",
  "C#m",
  "Dbm",
  "Dm",
  "Ebm",
  "Em",
  "Fm",
  "F#m",
  "Gbm",
  "Gm",
  "Abm",
  "Am",
  "Bbm",
  "Bm",
] as const;

function rootOf(key: string): string {
  const m = key.trim().match(/^([A-G][#b]?)(m)?/i);
  if (!m) return key.trim();
  const note = m[1]!;
  const minor = m[2] ? "m" : "";
  // Prefer standard casing
  const pretty =
    note.length === 1
      ? note.toUpperCase()
      : note[0]!.toUpperCase() + note.slice(1).replace("B", "b").replace("#", "#");
  return `${pretty}${minor}`;
}

/**
 * If key is missing/unknown/non-canonical, return a non-blocking warning.
 * Never blocks saves — ChordPro keys like "Bb-C" are common but not canonical.
 */
export function keyCanonicalWarning(key: string | null | undefined): {
  code: "key_not_canonical";
  key: string;
  suggestion: string | null;
  message: string;
} | null {
  if (key == null) return null;
  const raw = key.trim();
  if (!raw) return null;

  const canonicalSet = new Set(CANONICAL_KEYS.map((k) => k.toLowerCase()));
  if (canonicalSet.has(raw.toLowerCase())) return null;

  const root = rootOf(raw);
  const value = getNoteValue(root.replace(/m$/i, ""));
  let suggestion: string | null = null;
  if (value !== undefined) {
    // Prefer flats for black keys commonly used in worship
    const preferFlat = [1, 3, 6, 8, 10].includes(value);
    const names = preferFlat
      ? ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
      : ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const base = names[value] ?? null;
    if (base) suggestion = /m$/i.test(root) ? `${base}m` : base;
  } else if (canonicalSet.has(root.toLowerCase())) {
    suggestion = CANONICAL_KEYS.find((k) => k.toLowerCase() === root.toLowerCase()) ?? root;
  }

  return {
    code: "key_not_canonical",
    key: raw,
    suggestion,
    message: suggestion
      ? `Key "${raw}" is not canonical; consider "${suggestion}".`
      : `Key "${raw}" is not a single canonical pitch class (e.g. Bb, C#m).`,
  };
}
