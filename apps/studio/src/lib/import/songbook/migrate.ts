/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SongbookSong } from "./types";

const MAJOR_KEYS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
const MINOR_KEYS = [
  "Cm",
  "Dbm",
  "Dm",
  "Ebm",
  "Em",
  "Fm",
  "Gbm",
  "Gm",
  "Abm",
  "Am",
  "Bbm",
  "Bm",
] as const;

type SectionKind = "verse" | "chorus" | "bridge" | "part";

const SECTION_KEYWORDS: Record<SectionKind, string[]> = {
  verse: ["verso", "verse", "primeira parte", "segunda parte", "terceira parte"],
  chorus: ["refrao", "chorus", "coro"],
  bridge: [
    "ponte",
    "bridge",
    "pre-refrao",
    "prerefrao",
    "prechorus",
    "pre chorus",
    "pre-chorus",
    "pre-chorus",
    "post-chorus",
    "postchorus",
    "pos-refrao",
  ],
  part: [
    "intro",
    "introducao",
    "outro",
    "final",
    "ending",
    "coda",
    "instrumental",
    "interlude",
    "interludio",
    "solo",
    "riff",
    "turnaround",
    "tag",
    "vamp",
  ],
};

const SECTION_TAGS: Record<SectionKind, { start: string; end: string }> = {
  verse: { start: "start_of_verse", end: "end_of_verse" },
  chorus: { start: "start_of_chorus", end: "end_of_chorus" },
  bridge: { start: "start_of_bridge", end: "end_of_bridge" },
  part: { start: "start_of_part", end: "end_of_part" },
};

const COMMENT_DIRECTIVE_RE = /^\s*\{c(?:omment)?\s*:\s*([^}]*)\}\s*$/i;
const SECTION_SPLIT_RE = /(\{c(?:omment)?\s*:[^}]*\})/gi;

export function songbookKeyToChordPro(key: number | null | undefined): string | null {
  if (typeof key !== "number" || !Number.isFinite(key)) return null;
  if (key >= 0 && key <= 11) return MAJOR_KEYS[key] ?? null;
  if (key >= 12 && key <= 23) return MINOR_KEYS[key - 12] ?? null;
  return null;
}

function escapeDirectiveValue(value: string): string {
  return value.replace(/[{}]/g, "").trim();
}

function hasDirective(content: string, name: string): boolean {
  return new RegExp(`\\{${name}\\s*:`, "i").test(content);
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function classifySectionLabel(rawLabel: string): { kind: SectionKind; label: string } {
  const label = rawLabel.trim().replace(/:$/, "").trim() || "Part";
  const base = label.replace(/[\s_-]*\d+\s*$/, "").trim();
  const normalized = stripAccents(base)
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const kind of Object.keys(SECTION_KEYWORDS) as SectionKind[]) {
    if (
      SECTION_KEYWORDS[kind].some(
        (kw) => normalized === kw || normalized.startsWith(`${kw} `) || normalized.startsWith(kw),
      )
    ) {
      return { kind, label };
    }
  }
  return { kind: "part", label };
}

function expandShorthandTabDirectives(body: string): string {
  return body.replace(/\{sot\}/gi, "{start_of_tab}").replace(/\{eot\}/gi, "{end_of_tab}");
}

export function convertSongbookCommentSections(body: string): string {
  const normalized = expandShorthandTabDirectives(body.replace(/\r\n/g, "\n"));
  if (!/\{c(?:omment)?\s*:/i.test(normalized)) {
    return normalized.trim();
  }

  const parts = normalized.split(SECTION_SPLIT_RE);
  const out: string[] = [];
  let open: { end: string } | null = null;

  const closeOpen = () => {
    if (!open) return;
    out.push(`{${open.end}}`);
    open = null;
  };

  for (const part of parts) {
    if (!part) continue;
    const header = COMMENT_DIRECTIVE_RE.exec(part);
    if (header) {
      closeOpen();
      const rawLabel = (header[1] ?? "").trim();
      if (!rawLabel) continue;
      const { kind, label } = classifySectionLabel(rawLabel);
      const tags = SECTION_TAGS[kind];
      out.push("");
      out.push(`{${tags.start}: ${escapeDirectiveValue(label)}}`);
      open = { end: tags.end };
      continue;
    }

    const chunk = part.replace(/^\n+/, "").replace(/\n+$/, "");
    if (chunk) out.push(chunk);
  }

  closeOpen();
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function youtubeIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

export function migrateSongbookSongToChordPro(song: SongbookSong): {
  title: string;
  artist: string;
  content: string;
  tags: string[];
  song_number: number | null;
} {
  const title = song.name.trim() || "Untitled";
  const artist = song.author.trim() || "Vários";
  const key = songbookKeyToChordPro(song.key);
  const headers: string[] = [];

  if (!hasDirective(song.content, "title")) {
    headers.push(`{title: ${escapeDirectiveValue(title)}}`);
  }
  if (song.subTitle && !hasDirective(song.content, "subtitle")) {
    headers.push(`{subtitle: ${escapeDirectiveValue(song.subTitle)}}`);
  }
  if (!hasDirective(song.content, "artist")) {
    headers.push(`{artist: ${escapeDirectiveValue(artist)}}`);
  }
  if (key && !hasDirective(song.content, "key")) {
    headers.push(`{key: ${key}}`);
  }
  if (song.capo > 0 && !hasDirective(song.content, "capo")) {
    headers.push(`{capo: ${song.capo}}`);
  }
  if (song.tempo > 0 && !hasDirective(song.content, "tempo")) {
    headers.push(`{tempo: ${song.tempo}}`);
  }
  if (song.timeSig && !hasDirective(song.content, "time")) {
    headers.push(`{time: ${escapeDirectiveValue(song.timeSig)}}`);
  }
  if (song.copyright && !hasDirective(song.content, "copyright")) {
    headers.push(`{copyright: ${escapeDirectiveValue(song.copyright)}}`);
  }
  if (song.songNumber && !hasDirective(song.content, "song_number")) {
    headers.push(`{song_number: ${song.songNumber}}`);
  }
  if (song.sectionOrder) {
    headers.push(`{meta: section_order ${escapeDirectiveValue(song.sectionOrder)}}`);
  }
  if (song.keyShift !== 0) {
    headers.push(`{meta: key_shift ${song.keyShift}}`);
  }
  if (song.durationSeconds > 0 && !hasDirective(song.content, "duration")) {
    headers.push(`{duration: ${song.durationSeconds}}`);
  }
  if (song.url) {
    const yt = youtubeIdFromUrl(song.url);
    if (yt && !hasDirective(song.content, "youtube")) {
      headers.push(`{youtube: ${yt}}`);
    } else if (!yt) {
      headers.push(`{meta: source_url ${escapeDirectiveValue(song.url)}}`);
    }
  }

  const body = convertSongbookCommentSections(song.content);
  const notesBlock =
    song.notes.trim().length > 0 ? `\n\n{comment: ${escapeDirectiveValue(song.notes)}}` : "";

  const content = `${headers.join("\n")}${headers.length ? "\n\n" : ""}${body}${notesBlock}\n`;

  const tags = Array.from(
    new Set(["SongbookPro", ...song.tags.map((t) => t.trim()).filter(Boolean)]),
  );

  return {
    title,
    artist,
    content,
    tags,
    song_number: song.songNumber,
  };
}

export function sanitizePathSegment(value: string): string {
  return value.replace(/[\/\\]/g, "_").trim() || "Untitled";
}

export function uniqueSongPath(basePath: string, seen: Set<string>): string {
  if (!seen.has(basePath)) {
    seen.add(basePath);
    return basePath;
  }
  const match = /^(.*?)(\.pro)?$/i.exec(basePath);
  const stem = match?.[1] ?? basePath;
  const ext = match?.[2] ?? ".pro";
  let i = 2;
  while (seen.has(`${stem} (${i})${ext}`)) i += 1;
  const next = `${stem} (${i})${ext}`;
  seen.add(next);
  return next;
}
