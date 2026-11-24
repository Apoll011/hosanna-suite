// SPDX-License-Identifier: AGPL-3.0-only
import { transposeChord } from "./transpose";
import { instrumentRegistry } from "../instruments/registry";
import type { ChordProVersion } from "./parser";

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

function normalizedKey(key: string | undefined): string | null {
  const match = key?.trim().match(/^([A-Ga-g])([#b]?)(m|minor|min)?$/i);
  if (!match) return null;
  const pitch: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const semitone =
    (pitch[match[1].toUpperCase()] + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0) + 12) % 12;
  return `${semitone}:${match[3] ? "minor" : "major"}`;
}

export function resolveVariantDefaults(main: ChordProVersion, variant?: ChordProVersion) {
  if (!variant) {
    return {
      keyShift: parseKeyShiftValue(main.metadata.keyShift as string | undefined),
      capo: parseCapoValue(main.metadata.capo as string | undefined),
    };
  }
  const directives = new Set(variant.declaredDirectives ?? []);
  const variantKey = variant.metadata.key;
  const mainKey = main.metadata.key;
  const normalizedVariantKey = normalizedKey(
    typeof variantKey === "string" ? variantKey : undefined,
  );
  const normalizedMainKey = normalizedKey(typeof mainKey === "string" ? mainKey : undefined);
  const sameKey =
    normalizedMainKey !== null
      ? normalizedVariantKey === normalizedMainKey
      : mainKey === undefined && variantKey === undefined;
  return {
    keyShift: directives.has("key_shift")
      ? parseKeyShiftValue(variant.metadata.keyShift as string | undefined)
      : 0,
    capo: directives.has("capo")
      ? parseCapoValue(variant.metadata.capo as string | undefined)
      : sameKey
        ? parseCapoValue(main.metadata.capo as string | undefined)
        : 0,
  };
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

  const profile = typeof instrument === "string" ? instrumentRegistry.get(instrument) : instrument;

  const supportsCapo = profile?.supportsCapo ?? false;
  const shapeSemitones = keyShift - (supportsCapo ? capo : 0);

  const shownChords =
    shapeSemitones === 0 ? [...chords] : chords.map((c) => transposeChord(c, shapeSemitones));

  const rawKey = key ?? "C";
  const shownKey = shapeSemitones === 0 ? rawKey : transposeChord(rawKey, shapeSemitones);

  let capoLabel: string | null = null;
  if (supportsCapo && capo > 0) {
    capoLabel = `Capo ${capo} · shapes in ${shownKey}`;
  }

  return { shownKey, shownChords, capoLabel };
}
