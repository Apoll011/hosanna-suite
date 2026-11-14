import { transposeChord } from "./transpose";
import { instrumentRegistry } from "../instruments/registry";

export function parseCapoValue(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const s = String(raw).trim();
  if (!/^[0-9]+$/.test(s)) return 0;
  const n = parseInt(s, 10);
  if (n < 0 || n > 11) return 0;
  return n;
}

export function parseKeyShiftValue(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const s = String(raw).trim();
  if (!/^-?[0-9]+$/.test(s)) return 0;
  return parseInt(s, 10);
}

export interface ResolveChordOptions {
  chords: string[];
  key?: string;
  keyShift: number;
  capo: number;
  instrument: { supportsCapo?: boolean } | string;
}

export interface ResolvedChords {
  shownKey: string;
  shownChords: string[];
  capoLabel: string | null;
}

export function resolveChords(opts: ResolveChordOptions): ResolvedChords {
  const { chords, key, keyShift, capo, instrument } = opts;

  const profile = typeof instrument === "string"
    ? instrumentRegistry.get(instrument)
    : instrument;

  const supportsCapo = profile?.supportsCapo ?? false;
  const shapeSemitones = keyShift - (supportsCapo ? capo : 0);

  const shownChords = shapeSemitones === 0
    ? [...chords]
    : chords.map((c) => transposeChord(c, shapeSemitones));

  const rawKey = key ?? "C";
  const shownKey = shapeSemitones === 0 ? rawKey : transposeChord(rawKey, shapeSemitones);

  let capoLabel: string | null = null;
  if (supportsCapo && capo > 0) {
    capoLabel = `Capo ${capo} · shapes in ${shownKey}`;
  }

  return { shownKey, shownChords, capoLabel };
}
