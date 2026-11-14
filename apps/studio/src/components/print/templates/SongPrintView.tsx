/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { Song } from "@/src/types";
import { resolveChords, parseCapoValue, parseKeyShiftValue } from "@hosanna/chordpro";
import { loadSongPitchOverlay } from "@/src/hooks/usePreviewSettings";
import React, { useMemo } from "react";
import { safeParseSong } from "../parseSong";
import { buildSongBlocks } from "../songBlocks";
import { PrintBrand, PrintOptions } from "../types";
import { PrintSheet } from "./PrintSheet";
import { PrintSongBody } from "./PrintSongBody";
import { SongCredit, TemplateFooter } from "./TemplateFooter";
import { TemplateHeader } from "./TemplateHeader";

interface SongPrintViewProps {
  song: Song;
  options: PrintOptions;
  brand: PrintBrand;
  /** When true, this song shares the page with neighbours (no full-page pin). */
  packed?: boolean;
  /**
   * Church name/logo on this song. Standalone songs default to the option;
   * songbooks pass false (or true only on the first packed song).
   */
  showChurchIdentity?: boolean;
}

export { safeParseSong } from "../parseSong";

export const SongPrintView = React.memo<SongPrintViewProps>(function SongPrintView({
  song,
  options,
  brand,
  packed = false,
  showChurchIdentity = true,
}) {
  const { t } = useI18n();
  const { showChords } = options;
  const cacheKey = `${song.id}:${song.updatedAt ?? ""}:${song.content.length}`;

  const parsed = useMemo(() => safeParseSong(song.content, cacheKey), [song.content, cacheKey]);
  const meta = parsed?.metadata ?? {};

  const overlay = useMemo(() => loadSongPitchOverlay(song.id), [song.id]);
  const effectiveKeyShift = overlay ? overlay.transposeVal : parseKeyShiftValue(meta.keyShift);
  const effectiveCapo = overlay ? overlay.capoVal : parseCapoValue(meta.capo);

  const { shownKey, capoLabel } = useMemo(() => {
    return resolveChords({
      chords: [],
      key: meta.key,
      keyShift: effectiveKeyShift,
      capo: effectiveCapo,
      instrument: "guitar",
    });
  }, [meta.key, effectiveKeyShift, effectiveCapo]);

  const blocks = useMemo(() => {
    if (!parsed) return [];
    const delta = effectiveKeyShift - effectiveCapo;
    const transposed = delta !== 0 ? parsed.transpose(delta) : parsed;
    const display = showChords ? transposed : transposed.removeChords(true);
    return buildSongBlocks(display, { showChords });
  }, [parsed, showChords, effectiveKeyShift, effectiveCapo]);

  const title = meta.title || song.title;
  const subtitle = [meta.subtitle, meta.artist || song.artist].filter(Boolean).join(" · ");
  const number = meta.songNumber || song.song_number;

  const metaItems = [
    { label: t("print.song.key"), value: shownKey || meta.key },
    {
      label: t("print.song.capo"),
      value: capoLabel || (effectiveCapo > 0 ? `${effectiveCapo}ª casa` : undefined),
    },
    {
      label: t("print.song.tempo"),
      value: meta.tempo ? `${meta.tempo} BPM` : undefined,
    },
    { label: t("print.song.time"), value: meta.time },
  ].filter((item) => item.value);

  return (
    <PrintSheet
      className={packed ? "hp-sheet--song hp-sheet--packed" : "hp-sheet--song"}
      // Packed songs share a pack-level footer (one per page). Standalone
      // songs keep an in-flow footer for the preview; print uses @page.
      footer={packed ? undefined : <TemplateFooter options={options} brand={brand} />}
    >
      <TemplateHeader
        title={title}
        subtitle={subtitle || undefined}
        badge={number ? t("print.song.number", { number }) : undefined}
        options={options}
        brand={brand}
        showChurchIdentity={showChurchIdentity}
      />

      {options.showMetadata && metaItems.length > 0 && (
        <div className="hp-meta">
          {metaItems.map((item) => (
            <span key={item.label} className="hp-meta-item">
              <span className="hp-meta-label">{item.label}</span>
              <span className="hp-meta-value">{item.value}</span>
            </span>
          ))}
        </div>
      )}

      {blocks.length > 0 ? (
        <PrintSongBody
          blocks={blocks}
          showChords={showChords}
          showLabels={options.showSectionLabels}
          twoColumns={options.twoColumnLayout}
        />
      ) : (
        <p className="hp-empty">{t("print.song.empty")}</p>
      )}

      <SongCredit ccli={meta.ccli} copyright={meta.copyright} />
    </PrintSheet>
  );
});
