/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAgenda } from "@/src/hooks/useAgenda";
import { useI18n } from "@/src/lib/i18n";
import { Service, ServiceElement, Song } from "@/src/types";
import React, { useMemo } from "react";
import { PrintBrand, PrintOptions } from "../types";
import { PrintSheet } from "./PrintSheet";
import { SongPrintView } from "./SongPrintView";
import { TemplateFooter } from "./TemplateFooter";
import { TemplateHeader } from "./TemplateHeader";

interface ServicePrintViewProps {
  service: Service;
  songs?: Song[];
  options: PrintOptions;
  brand: PrintBrand;
}

export function formatPrintDate(date: string, locale: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  return s ? `${m}m ${s}s` : `${m} min`;
};

/** Parse "HH:MM" / "H:MM" / "HH:MM:SS" into minutes from midnight. */
export function parseClockToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec((time || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

const formatClock = (totalMinutes: number) => {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const ServicePrintView: React.FC<ServicePrintViewProps> = ({
  service,
  songs = [],
  options,
  brand,
}) => {
  const { t } = useI18n();
  const { events } = useAgenda();

  const elements = useMemo(() => service.elements || [], [service.elements]);
  const totalSeconds = elements.reduce((acc, el) => acc + (el.duration || 0), 0);
  const hasTiming = totalSeconds > 0;

  const linkedEvent = useMemo(() => {
    const linked = events.filter((e) => e.linkedServiceId === service.id);
    if (linked.length === 0) return null;
    const serviceDay = (service.date || "").slice(0, 10);
    return linked.find((e) => (e.date || "").slice(0, 10) === serviceDay) || linked[0];
  }, [events, service.date, service.id]);

  const serviceStartMinutes = linkedEvent ? parseClockToMinutes(linkedEvent.time) : null;
  // Only show Início when a linked agenda event gives a real wall-clock start.
  const showClockStart = serviceStartMinutes != null && hasTiming;

  const startOffsets = useMemo(() => {
    let acc = 0;
    return elements.map((el) => {
      const start = acc;
      acc += el.duration || 0;
      return start;
    });
  }, [elements]);

  const songsToPrint = useMemo(() => {
    if (!options.includeSongs) return [];
    const byId = new Map(songs.map((s) => [s.id, s]));
    const seen = new Set<string>();
    const result: Song[] = [];
    for (const el of elements) {
      const song = el.type === "song" && el.songId && byId.get(el.songId);
      if (song && !seen.has(song.id)) {
        seen.add(song.id);
        result.push(song);
      }
    }
    return result;
  }, [elements, songs, options.includeSongs]);

  const typeLabel = (type: ServiceElement["type"]) => {
    switch (type) {
      case "welcome":
        return t("print.service.types.welcome");
      case "scripture":
        return t("print.service.types.scripture");
      case "song":
        return t("print.service.types.song");
      case "message":
        return t("print.service.types.message");
      case "announcement":
        return t("print.service.types.announcement");
      default:
        return t("print.service.types.moment");
    }
  };

  const subtitle = [
    formatPrintDate(service.date, brand.locale),
    linkedEvent?.time ? linkedEvent.time.slice(0, 5) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PrintSheet
        className="hp-sheet--service"
        footer={<TemplateFooter options={options} brand={brand} />}
      >
        <TemplateHeader
          title={service.name}
          subtitle={subtitle}
          badge={t("print.service.badge")}
          options={options}
          brand={brand}
        />

        <section className="hp-block">
          <h2 className="hp-h2">
            <span>{t("print.service.order")}</span>
            {hasTiming && (
              <span className="hp-h2-aside">
                {t("print.service.totalDuration", {
                  duration: formatDuration(totalSeconds),
                })}
              </span>
            )}
          </h2>

          {elements.length === 0 ? (
            <p className="hp-empty">{t("print.service.noElements")}</p>
          ) : (
            <table className="hp-table">
              <thead>
                <tr>
                  <th className="hp-num">#</th>
                  {showClockStart && <th className="hp-right">{t("print.service.startCol")}</th>}
                  <th>{t("print.service.momentCol")}</th>
                  <th>{t("print.service.itemCol")}</th>
                  {hasTiming && <th className="hp-right">{t("print.service.durationCol")}</th>}
                </tr>
              </thead>
              <tbody>
                {elements.map((el, idx) => (
                  <tr key={el.id || idx}>
                    <td className="hp-num">{idx + 1}</td>
                    {showClockStart && serviceStartMinutes != null && (
                      <td className="hp-right hp-mono">
                        {formatClock(serviceStartMinutes + Math.floor(startOffsets[idx] / 60))}
                      </td>
                    )}
                    <td>
                      <span className={`hp-tag hp-tag--${el.type}`}>{typeLabel(el.type)}</span>
                    </td>
                    <td>
                      <div className="hp-cell-title">
                        <span>{el.title}</span>
                        {el.passage && <span className="hp-passage">{el.passage}</span>}
                      </div>
                      {el.type === "scripture" && el.content ? (
                        <div className="hp-cell-quote">{el.content}</div>
                      ) : (
                        el.content && <div className="hp-cell-sub">{el.content}</div>
                      )}
                      {el.notes && (
                        <div className="hp-cell-sub">
                          <em>{el.notes}</em>
                        </div>
                      )}
                    </td>
                    {hasTiming && (
                      <td className="hp-right">
                        {formatDuration(el.duration) || <span className="hp-dim">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {service.notes && (
          <section className="hp-block hp-note">
            <div className="hp-note-label">{t("print.service.notes")}</div>
            <p>{service.notes}</p>
          </section>
        )}
      </PrintSheet>

      {songsToPrint.length > 0 &&
        (!options.pageBreakBetweenItems ? (
          <div className="hp-song-pack">
            {songsToPrint.map((song, index) => (
              <SongPrintView
                key={song.id}
                song={song}
                options={options}
                brand={brand}
                packed
                showChurchIdentity={index === 0}
              />
            ))}
            <TemplateFooter options={options} brand={brand} />
          </div>
        ) : (
          songsToPrint.map((song) => (
            <SongPrintView
              key={song.id}
              song={song}
              options={options}
              brand={brand}
              showChurchIdentity={false}
            />
          ))
        ))}
    </>
  );
};
