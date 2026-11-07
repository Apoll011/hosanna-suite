import { Button, Modal } from "@/src/components/common";
import {
  DurationField,
  durationInputToSeconds,
  secondsToDurationInput,
} from "@/src/components/DurationField";
import { useI18n } from "@/src/lib/i18n";
import { BookOpen, Check, ChevronDown, Loader2, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// ── Bolls Life Bible API Integration ──────────────────────────────────
// API explicitly permits free web usage. It replaces the buggy NPM package.

const PRIORITY_TRANSLATIONS = ["ARA", "NVI", "NTLH", "ARK", "ARC"];

interface Translation {
  short_name: string;
  full_name: string;
}

// Fallback translations if the initial list fetch fails
const FALLBACK_TRANSLATIONS: Translation[] = [
  { short_name: "ARA", full_name: "Almeida Revista e Atualizada" },
  { short_name: "NVI", full_name: "Nova Versão Internacional" },
  { short_name: "NTLH", full_name: "Nova Tradução na Linguagem de Hoje" },
  { short_name: "ARC", full_name: "Almeida Revista e Corrigida" },
  { short_name: "NVT", full_name: "Nova Versão Transformadora" },
  { short_name: "KJV", full_name: "King James Version" },
];

let cachedTranslations: Translation[] | null = null;

function sortTranslations(translations: Translation[]): Translation[] {
  const priority = new Map(PRIORITY_TRANSLATIONS.map((id, i) => [id, i]));
  return [...translations].sort((a, b) => {
    const pa = priority.get(a.short_name) ?? 999;
    const pb = priority.get(b.short_name) ?? 999;
    if (pa !== pb) return pa - pb;
    return a.full_name.localeCompare(b.full_name);
  });
}

// Robust helper to normalize variations (e.g. "I João", "1 joão", "Primeira João" -> "1joao")
const normalizeBookName = (name: string) => {
  let normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  normalized = normalized.replace(/^(primeira|primeiro|1|i)\s+/, "1");
  normalized = normalized.replace(/^(segunda|segundo|2|ii)\s+/, "2");
  normalized = normalized.replace(/^(terceira|terceiro|3|iii)\s+/, "3");

  return normalized.replace(/\s+/g, "");
};

// ── Book Name Mapping ─────────────────────────────────────────────────
const BOOK_NAME_MAP: Record<string, number> = {
  genesis: 1,
  gn: 1,
  exodo: 2,
  ex: 2,
  levitico: 3,
  lv: 3,
  numeros: 4,
  nm: 4,
  deuteronomio: 5,
  dt: 5,
  josue: 6,
  js: 6,
  juizes: 7,
  jz: 7,
  rute: 8,
  rt: 8,
  "1samuel": 9,
  "1sm": 9,
  "2samuel": 10,
  "2sm": 10,
  "1reis": 11,
  "1rs": 11,
  "2reis": 12,
  "2rs": 12,
  "1cronicas": 13,
  "1cr": 13,
  "2cronicas": 14,
  "2cr": 14,
  esdras: 15,
  ed: 15,
  neemias: 16,
  ne: 16,
  ester: 17,
  et: 17,
  jo: 18,
  job: 18,
  salmos: 19,
  salmo: 19,
  sl: 19,
  proverbios: 20,
  pv: 20,
  eclesiastes: 21,
  ec: 21,
  canticos: 22,
  cantares: 22,
  ct: 22,
  canticodoscanticos: 22,
  cantaresdesalomao: 22,
  isaias: 23,
  is: 23,
  jeremias: 24,
  jr: 24,
  lamentacoes: 25,
  lm: 25,
  ezequiel: 26,
  ez: 26,
  daniel: 27,
  dn: 27,
  oseias: 28,
  os: 28,
  joel: 29,
  jl: 29,
  amos: 30,
  am: 30,
  obadias: 31,
  ob: 31,
  jonas: 32,
  jn: 32,
  miqueias: 33,
  mq: 33,
  naum: 34,
  na: 34,
  habacuque: 35,
  hc: 35,
  sofonias: 36,
  sf: 36,
  ageu: 37,
  ag: 37,
  zacarias: 38,
  zc: 38,
  malaquias: 39,
  ml: 39,
  mateus: 40,
  mt: 40,
  marcos: 41,
  mc: 41,
  lucas: 42,
  lc: 42,
  joao: 43,
  atos: 44,
  at: 44,
  romanos: 45,
  rm: 45,
  "1corintios": 46,
  "1co": 46,
  "2corintios": 47,
  "2co": 47,
  galatas: 48,
  gl: 48,
  efesios: 49,
  ef: 49,
  filipenses: 50,
  fp: 50,
  fl: 50,
  colossenses: 51,
  cl: 51,
  "1tessalonicenses": 52,
  "1ts": 52,
  "2tessalonicenses": 53,
  "2ts": 53,
  "1timoteo": 54,
  "1tm": 54,
  "2timoteo": 55,
  "2tm": 55,
  tito: 56,
  tt: 56,
  filemom: 57,
  fm: 57,
  filemon: 57,
  hebreus: 58,
  hb: 58,
  tiago: 59,
  tg: 59,
  "1pedro": 60,
  "1pe": 60,
  "2pedro": 61,
  "2pe": 61,
  "1joao": 62,
  "1jo": 62,
  "2joao": 63,
  "2jo": 63,
  "3joao": 64,
  "3jo": 64,
  judas: 65,
  jd: 65,
  apocalipse: 66,
  ap: 66,
};

const PRETTY_BOOK_NAMES: Record<number, string> = {
  1: "Gênesis",
  2: "Êxodo",
  3: "Levítico",
  4: "Números",
  5: "Deuteronômio",
  6: "Josué",
  7: "Juízes",
  8: "Rute",
  9: "1 Samuel",
  10: "2 Samuel",
  11: "1 Reis",
  12: "2 Reis",
  13: "1 Crônicas",
  14: "2 Crônicas",
  15: "Esdras",
  16: "Neemias",
  17: "Ester",
  18: "Jó",
  19: "Salmos",
  20: "Provérbios",
  21: "Eclesiastes",
  22: "Cânticos",
  23: "Isaías",
  24: "Jeremias",
  25: "Lamentações",
  26: "Ezequiel",
  27: "Daniel",
  28: "Oseias",
  29: "Joel",
  30: "Amós",
  31: "Obadias",
  32: "Jonas",
  33: "Miqueias",
  34: "Naum",
  35: "Habacuque",
  36: "Sofonias",
  37: "Ageu",
  38: "Zacarias",
  39: "Malaquias",
  40: "Mateus",
  41: "Marcos",
  42: "Lucas",
  43: "João",
  44: "Atos",
  45: "Romanos",
  46: "1 Coríntios",
  47: "2 Coríntios",
  48: "Gálatas",
  49: "Efésios",
  50: "Filipenses",
  51: "Colossenses",
  52: "1 Tessalonicenses",
  53: "2 Tessalonicenses",
  54: "1 Timóteo",
  55: "2 Timóteo",
  56: "Tito",
  57: "Filemom",
  58: "Hebreus",
  59: "Tiago",
  60: "1 Pedro",
  61: "2 Pedro",
  62: "1 João",
  63: "2 João",
  64: "3 João",
  65: "Judas",
  66: "Apocalipse",
};

interface ParsedPassage {
  bookId: number;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  raw: string;
}

// Timeout fetch abstraction helper
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/** Extract clean text from a chapter response array, filtering to the given verse range. */
function extractVerseText(
  chapterVerses: Array<{ verse?: string | number; text?: string }>,
  startVerse?: number,
  endVerse?: number,
): string {
  const lines: string[] = [];
  for (const item of chapterVerses) {
    const vn = parseInt(item.verse as string, 10);
    if (startVerse !== undefined && vn < startVerse) continue;
    if (endVerse !== undefined && vn > endVerse) continue;

    const cleanText = (item.text || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    lines.push(`${vn} ${cleanText}`);
  }
  return lines.join("\n");
}

function parsePassageInput(input: string): ParsedPassage | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(.+?)\s+(\d+)(?:[:.,]\s*(\d+)(?:\s*[-–,]\s*(\d+))?)?$/,
  );
  if (!match) return null;

  const rawBookStr = match[1];
  const chapter = parseInt(match[2], 10);
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;

  const normalized = normalizeBookName(rawBookStr);
  const bookId = BOOK_NAME_MAP[normalized];

  if (!bookId) return null;

  return { bookId, chapter, startVerse, endVerse, raw: trimmed };
}

// ══════════════════════════════════════════════════════════════════════
// ── Scripture Modal Component ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

interface ScriptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    passage: string;
    notes: string;
    duration: number;
  }) => void;
  initial?: {
    title: string;
    content: string;
    passage: string;
    notes: string;
    duration?: number;
  };
}

export const ScriptureModal: React.FC<ScriptureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initial,
}) => {
  const { t } = useI18n();
  const defaultTitle = t("serviceModals.bible.modalTitle");

  const [title, setTitle] = useState(initial?.title || defaultTitle);
  const [passageInput, setPassageInput] = useState(initial?.passage || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [duration, setDuration] = useState(
    secondsToDurationInput(initial?.duration),
  );

  const [translations, setTranslations] = useState<Translation[]>(
    FALLBACK_TRANSLATIONS,
  );
  const [selectedTranslation, setSelectedTranslation] = useState("ARA");
  const [translationsLoading, setTranslationsLoading] = useState(false);

  const [fetchedText, setFetchedText] = useState<string | null>(null);
  const [fetchedPassageLabel, setFetchedPassageLabel] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  // Load translations on first open (cached globally)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    if (cachedTranslations) {
      setTranslations(cachedTranslations);
      return;
    }

    (async () => {
      setTranslationsLoading(true);
      try {
        const res = await fetchWithTimeout(
          "https://bolls.life/static/bolls/app/views/languages.json",
        );
        if (res.ok) {
          const data = await res.json();
          const sorted = sortTranslations(data);
          cachedTranslations = sorted;
          if (!cancelled) setTranslations(sorted);
        }
      } catch {
        // Silently fail – fallback to FALLBACK_TRANSLATIONS
      } finally {
        if (!cancelled) setTranslationsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Snapshot form fields only when the modal opens — do not depend on
  // `initial` identity, or parent re-renders reset in-progress edits.
  useEffect(() => {
    if (!isOpen) return;
    setTitle(initial?.title?.trim() ? initial.title : defaultTitle);
    setPassageInput(initial?.passage || "");
    setNotes(initial?.notes || "");
    setDuration(secondsToDurationInput(initial?.duration));
    setFetchedText(initial?.content || null);
    setFetchedPassageLabel(initial?.passage || "");
    setFetchError(null);
    setAccepted(Boolean(initial?.content?.trim()));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open only
  }, [isOpen]);

  const handleSearch = useCallback(async () => {
    const parsed = parsePassageInput(passageInput);
    if (!parsed) {
      setFetchError(t("serviceModals.bible.invalidFormatError"));
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchedText(null);
    setAccepted(false);

    try {
      const url = `https://bolls.life/get-text/${selectedTranslation}/${parsed.bookId}/${parsed.chapter}/`;
      const res = await fetchWithTimeout(url);

      if (!res.ok) throw new Error(t("serviceModals.bible.notFoundError"));

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(t("serviceModals.bible.chapterNotFoundError"));
      }

      const text = extractVerseText(data, parsed.startVerse, parsed.endVerse);

      if (!text.trim()) {
        throw new Error(t("serviceModals.bible.noVersesError"));
      }

      const prettyBookName = PRETTY_BOOK_NAMES[parsed.bookId];
      let label = `${prettyBookName} ${parsed.chapter}`;
      if (parsed.startVerse !== undefined) {
        label += `:${parsed.startVerse}`;
        if (
          parsed.endVerse !== undefined &&
          parsed.endVerse !== parsed.startVerse
        ) {
          label += `-${parsed.endVerse}`;
        }
      }
      label += ` (${selectedTranslation})`;

      setFetchedPassageLabel(label);
      setFetchedText(text);
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === "AbortError") {
        setFetchError(t("serviceModals.bible.timeoutError"));
      } else {
        setFetchError(
          errorObj?.message || t("serviceModals.bible.genericError"),
        );
      }
    } finally {
      setIsFetching(false);
    }
  }, [passageInput, selectedTranslation, t]);

  const handleAcceptPassage = () => {
    setAccepted(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title,
      content: accepted ? fetchedText || "" : "",
      passage: accepted ? fetchedPassageLabel || passageInput : passageInput,
      notes,
      duration: durationInputToSeconds(duration),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("serviceModals.bible.modalTitle")}
      maxWidth="lg"
    >
      <div className="space-y-4 py-2">
        {/* Header Banner */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#FDF4FF" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#C026D3", color: "white" }}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#C026D3" }}>
              {t("serviceModals.bible.badgeTitle")}
            </p>
            <p className="text-[11px] text-slate-500">
              {t("serviceModals.bible.badgeDesc")}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.bible.titleLabel")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("serviceModals.bible.titlePlaceholder")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        {/* Translation Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.bible.translationLabel")}
          </label>
          <div className="relative">
            <select
              value={selectedTranslation}
              onChange={(e) => {
                setSelectedTranslation(e.target.value);
                setFetchedText(null);
                setAccepted(false);
              }}
              disabled={translationsLoading}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 appearance-none pr-8"
            >
              {translations.map((t) => (
                <option key={t.short_name} value={t.short_name}>
                  {t.short_name} — {t.full_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {translationsLoading && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("serviceModals.bible.loadingTranslations")}
            </p>
          )}
        </div>

        {/* Passage Input + Search */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.bible.passageLabel")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={passageInput}
              onChange={(e) => {
                setPassageInput(e.target.value);
                setFetchedText(null);
                setFetchError(null);
                setAccepted(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder={t("serviceModals.bible.passagePlaceholder")}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={isFetching || !passageInput.trim()}
            >
              {isFetching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              {isFetching
                ? t("serviceModals.bible.searchingBtn")
                : t("serviceModals.bible.searchBtn")}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400">
            {t("serviceModals.bible.acceptedFormats")}
          </p>
        </div>

        {/* Error */}
        {fetchError && (
          <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800/80">
            {fetchError}
          </div>
        )}

        {/* Fetched text preview */}
        {fetchedText && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {fetchedPassageLabel}
              </p>
              {!accepted ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptPassage}
                >
                  <Check className="w-3.5 h-3.5" />
                  {t("serviceModals.bible.usePassageBtn")}
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Check className="w-3 h-3" />
                  {t("serviceModals.bible.acceptedBadge")}
                </span>
              )}
            </div>
            <div
              className="max-h-60 overflow-y-auto rounded-xl border p-3 text-xs leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: accepted ? "#F0FDF4" : "#FAFAFA",
                borderColor: accepted ? "#BBF7D0" : "#cbd5e1",
                color: "#374151",
              }}
            >
              {fetchedText}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {t("serviceModals.bible.notesLabel")}
            <span className="font-normal text-slate-400 ml-1">
              ({t("common.details")})
            </span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("serviceModals.bible.notesPlaceholder")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        <DurationField
          value={duration}
          onChange={setDuration}
          accentRingClass="focus:ring-fuchsia-500/40"
          badgeClass="text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/50 border-fuchsia-200/50 dark:border-fuchsia-800/50"
          presets={[
            { label: "2:00", sec: 120 },
            { label: "3:00", sec: 180 },
            { label: "5:00", sec: 300 },
          ]}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
