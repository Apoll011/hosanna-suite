import { analyzeChordSymbol } from "./chordDictionary";

export type DiagnosticSeverity = "error" | "warning";

export interface ChordProDiagnostic {
  line: number;
  column?: number;
  endColumn?: number;
  severity: DiagnosticSeverity;
  message: string;
  code: string;
}

export type LintLanguage = "pt" | "en" | "es";

export interface LintOptions {
  language?: LintLanguage | string;
}

const BLOCK_START_ALIASES: Record<string, string> = {
  sov: "verse",
  start_of_verse: "verse",
  soc: "chorus",
  start_of_chorus: "chorus",
  sob: "bridge",
  start_of_bridge: "bridge",
  sot: "tab",
  start_of_tab: "tab",
  sog: "grid",
  start_of_grid: "grid",
  sop: "part",
  start_of_part: "part",
  sol: "lead",
  start_of_lead: "lead",
  sor: "refrain",
  start_of_refrain: "refrain",
  som: "middle",
  start_of_middle: "middle",
  soe: "outro",
  start_of_outro: "outro",
  sov_ver: "version",
  start_of_version: "version",
};

const BLOCK_END_ALIASES: Record<string, string> = {
  eov: "verse",
  end_of_verse: "verse",
  eoc: "chorus",
  end_of_chorus: "chorus",
  eob: "bridge",
  end_of_bridge: "bridge",
  eot: "tab",
  end_of_tab: "tab",
  eog: "grid",
  end_of_grid: "grid",
  eop: "part",
  end_of_part: "part",
  eol: "lead",
  end_of_lead: "lead",
  eor: "refrain",
  end_of_refrain: "refrain",
  eom: "middle",
  end_of_middle: "middle",
  eoe: "outro",
  end_of_outro: "outro",
  eov_ver: "version",
  end_of_version: "version",
};

const MAJOR_SECTIONS = new Set(["verse", "chorus", "bridge", "version", "part", "refrain", "lead", "outro"]);

const TEXT_METADATA_DIRECTIVES = new Set([
  "title",
  "t",
  "subtitle",
  "st",
  "artist",
  "a",
  "composer",
  "lyricist",
  "arranger",
  "translator",
  "album",
  "copyright",
  "song_number",
  "songnumber",
  "key_note",
  "keynote",
  "tags",
  "meta",
  "start_of_version",
  "sov_ver",
]);

const COMMENT_DIRECTIVES = new Set([
  "comment",
  "c",
  "comment_italic",
  "ci",
  "comment_box",
  "cb",
]);

const SIZE_DIRECTIVES = new Set([
  "textsize",
  "chordsize",
  "tabsize",
  "gridsize",
]);

const COLOR_DIRECTIVES = new Set([
  "textcolor",
  "textcolour",
  "chordcolor",
  "chordcolour",
]);

const KEY_REGEX = /^(?:[A-G]|D[oó]|R[eé]|Mi|F[aá]|Sol|L[aá]|Si)[#b♯♭]?(?:\s*(?:m|min|minor|menor|maj|major|maior|M))?$/i;

const VALID_DENOMINATORS = new Set([1, 2, 4, 8, 16, 32, 64]);

function normalizeLang(lang?: string): LintLanguage {
  if (!lang) return "pt";
  const lower = lang.toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "es";
  return "pt";
}

function resolveBlockStart(name: string): string | null {
  if (name in BLOCK_START_ALIASES) return BLOCK_START_ALIASES[name];
  if (name.startsWith("start_of_")) return name.slice(9);
  return null;
}

function resolveBlockEnd(name: string): string | null {
  if (name in BLOCK_END_ALIASES) return BLOCK_END_ALIASES[name];
  if (name.startsWith("end_of_")) return name.slice(7);
  return null;
}

export function isValidKey(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return KEY_REGEX.test(trimmed);
}

export function isValidTimeSignature(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "C" || trimmed === "C|") return true;
  const match = trimmed.match(/^([1-9]\d*)\s*\/\s*([1-9]\d*)$/);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  const den = parseInt(match[2], 10);
  if (num < 1 || num > 64) return false;
  return VALID_DENOMINATORS.has(den);
}

export function isValidYear(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return false;
  const y = parseInt(trimmed, 10);
  return y >= 1000 && y <= 2099;
}

export function isValidDuration(value: string): boolean {
  const trimmed = value.trim();
  const mssMatch = trimmed.match(/^(\d{1,3}):(\d{2})$/);
  if (mssMatch) {
    const s = parseInt(mssMatch[2], 10);
    return s >= 0 && s < 60;
  }
  const hmmssMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (hmmssMatch) {
    const m = parseInt(hmmssMatch[2], 10);
    const s = parseInt(hmmssMatch[3], 10);
    return m >= 0 && m < 60 && s >= 0 && s < 60;
  }
  if (/^\d+$/.test(trimmed)) {
    const s = parseInt(trimmed, 10);
    return s > 0 && s <= 86400;
  }
  return false;
}

export function isValidYouTube(value: string): boolean {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return true;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return /^[a-zA-Z0-9_-]{11}$/.test(id);
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") {
        const v = url.searchParams.get("v");
        return !!v && /^[a-zA-Z0-9_-]{11}$/.test(v);
      }
      if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/v/")) {
        const parts = url.pathname.split("/").filter(Boolean);
        return parts.length >= 2 && /^[a-zA-Z0-9_-]{11}$/.test(parts[1]);
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function isValidCcli(value: string): boolean {
  const trimmed = value.trim();
  return /^[0-9]+$/.test(trimmed) && parseInt(trimmed, 10) > 0;
}

export function isValidRepeat(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^([1-9]\d*)\s*(?:x|vezes)?$/i.test(trimmed);
}

function getValueRange(line: string, colonIdx: number, trimmedValue: string): { column: number; endColumn: number } {
  if (!trimmedValue) {
    return {
      column: line.indexOf("{"),
      endColumn: line.lastIndexOf("}") + 1,
    };
  }
  const afterColon = line.slice(colonIdx + 1);
  const leadingSpaces = afterColon.length - afterColon.trimStart().length;
  const startCol = colonIdx + 1 + leadingSpaces;
  const endCol = startCol + trimmedValue.length;
  return { column: startCol, endColumn: endCol };
}

function getMessages(lang: LintLanguage) {
  return {
    emptyChord: {
      pt: "Acorde vazio: '[]'.",
      en: "Empty chord: '[]'.",
      es: "Acorde vacío: '[]'.",
    }[lang],
    unknownChordRoot: (chord: string) => ({
      pt: `Acorde não reconhecido: "${chord}".`,
      en: `Unrecognized chord: "${chord}".`,
      es: `Acorde no reconocido: "${chord}".`,
    }[lang]),
    unknownChordQuality: (chord: string) => ({
      pt: `Qualidade de acorde não reconhecida em "${chord}" (assumida como maior).`,
      en: `Unrecognized chord quality in "${chord}" (assumed major).`,
      es: `Calidad de acorde no reconocida en "${chord}" (asumida como mayor).`,
    }[lang]),
    unmatchedBracketClose: {
      pt: "']' de fecho sem '[' correspondente.",
      en: "Closing ']' without a matching '['.",
      es: "']' de cierre sin '[' correspondiente.",
    }[lang],
    unclosedBracket: {
      pt: "Acorde não fechado — falta ']'.",
      en: "Unclosed chord — missing ']'.",
      es: "Acorde sin cerrar — falta ']'.",
    }[lang],
    unclosedDirective: {
      pt: "Diretiva não fechada — falta '}'.",
      en: "Unclosed directive — missing '}'.",
      es: "Directiva sin cerrar — falta '}'.",
    }[lang],
    emptyDirective: {
      pt: "Diretiva vazia '{}'.",
      en: "Empty directive '{}'.",
      es: "Directiva vacía '{}'.",
    }[lang],
    emptyDirectiveValue: (name: string) => ({
      pt: `'{${name}}' precisa de um valor não vazio.`,
      en: `'{${name}}' requires a non-empty value.`,
      es: `'{${name}}' requiere un valor no vacío.`,
    }[lang]),
    missingColonSeparator: (directive: string) => ({
      pt: `Possível diretiva malformada (falta separador ':'): "{${directive}}".`,
      en: `Possible malformed directive (missing ':' separator): "{${directive}}".`,
      es: `Posible directiva malformada (falta el separador ':'): "{${directive}}".`,
    }[lang]),
    chorusRecallWithoutChorus: {
      pt: "'{chorus}' repete o refrão anterior, mas ainda não existe nenhum '{start_of_chorus}' antes.",
      en: "'{chorus}' recalls the previous chorus, but no '{start_of_chorus}' precedes it.",
      es: "'{chorus}' repite el estribillo anterior, pero no hay ningún '{start_of_chorus}' previo.",
    }[lang],
    nestedSection: (name: string, parentName: string, parentLine: number) => ({
      pt: `A secção '${name}' foi aberta dentro de '${parentName}' (aberta na linha ${parentLine}) sem fechar a secção anterior.`,
      en: `Section '${name}' was opened inside '${parentName}' (opened on line ${parentLine}) without closing the previous section.`,
      es: `La sección '${name}' se abrió dentro de '${parentName}' (abierta en la línea ${parentLine}) sin cerrar la sección anterior.`,
    }[lang]),
    interlockedBlocks: (closingRaw: string, closingName: string, innerName: string, innerLine: number) => ({
      pt: `Secção interligada incorretamente: '{${closingRaw}}' tenta fechar '${closingName}', mas a secção interior '${innerName}' (aberta na linha ${innerLine}) ainda está aberta.`,
      en: `Improperly interlocked sections: '{${closingRaw}}' attempts to close '${closingName}', but inner section '${innerName}' (opened on line ${innerLine}) is still open.`,
      es: `Secciones entrelazadas incorrectamente: '{${closingRaw}}' intenta cerrar '${closingName}', pero la sección interior '${innerName}' (abierta en la línea ${innerLine}) sigue abierta.`,
    }[lang]),
    unmatchedBlockEnd: (rawName: string, name: string) => ({
      pt: `'{${rawName}}' sem uma secção '${name}' aberta correspondente.`,
      en: `'{${rawName}}' without a matching open '${name}' section.`,
      es: `'{${rawName}}' sin una sección '${name}' abierta correspondiente.`,
    }[lang]),
    mismatchedBlockEnd: (expected: string, line: number, found: string) => ({
      pt: `Esperava-se o fecho de '${expected}' (aberta na linha ${line}), mas encontrou '{${found}}'.`,
      en: `Expected closing of '${expected}' (opened on line ${line}), but found '{${found}}'.`,
      es: `Se esperaba el cierre de '${expected}' (abierta en la línea ${line}), pero se encontró '{${found}}'.`,
    }[lang]),
    unclosedBlock: (name: string) => ({
      pt: `Secção '${name}' aberta aqui nunca foi fechada (falta o directive de fecho correspondente).`,
      en: `Section '${name}' opened here was never closed (missing matching closing directive).`,
      es: `Sección '${name}' abierta aquí nunca se cerró (falta la directiva de cierre correspondiente).`,
    }[lang]),
    nonNumericValue: (name: string, value: string) => ({
      pt: `Valor de '${name}' deveria ser numérico, encontrado "${value}".`,
      en: `Value of '${name}' should be numeric, found "${value}".`,
      es: `El valor de '${name}' debe ser numérico, encontrado "${value}".`,
    }[lang]),
    invalidTempoRange: (value: string) => ({
      pt: `Valor de tempo deve estar entre 20 e 400 BPM, encontrado "${value}".`,
      en: `Tempo value should be between 20 and 400 BPM, found "${value}".`,
      es: `El valor de tempo debe estar entre 20 y 400 BPM, encontrado "${value}".`,
    }[lang]),
    invalidCapoRange: (value: string) => ({
      pt: `Valor de capo deve ser um inteiro entre 0 e 11, encontrado "${value}".`,
      en: `Capo value must be an integer between 0 and 11, found "${value}".`,
      es: `El valor de capo debe ser un entero entre 0 y 11, encontrado "${value}".`,
    }[lang]),
    invalidKeyshiftValue: (value: string) => ({
      pt: `Valor de keyshift deve ser um inteiro com sinal, encontrado "${value}".`,
      en: `Keyshift value must be a signed integer, found "${value}".`,
      es: `El valor de keyshift debe ser un entero con signo, encontrado "${value}".`,
    }[lang]),
    invalidTimeSignature: (value: string) => ({
      pt: `Formato de compasso inválido: "${value}" — use numerador/denominador (ex.: 4/4, 6/8).`,
      en: `Invalid time signature format: "${value}" — use numerator/denominator (e.g. 4/4, 6/8).`,
      es: `Formato de compás no válido: "${value}" — use numerador/denominador (ej.: 4/4, 6/8).`,
    }[lang]),
    invalidKey: (value: string) => ({
      pt: `Tom musical inválido: "${value}" — use uma nota válida (ex.: G, C#m, Bb, Dó menor).`,
      en: `Invalid musical key: "${value}" — use a valid key notation (e.g. G, C#m, Bb, A minor).`,
      es: `Tonalidad musical no válida: "${value}" — use una nota válida (ej.: G, C#m, Bb, Re menor).`,
    }[lang]),
    invalidYear: (value: string) => ({
      pt: `Ano inválido: "${value}" — use um ano de 4 dígitos (ex.: 2024).`,
      en: `Invalid year: "${value}" — use a 4-digit year (e.g. 2024).`,
      es: `Año no válido: "${value}" — use un año de 4 dígitos (ej.: 2024).`,
    }[lang]),
    invalidDuration: (value: string) => ({
      pt: `Formato de duração inválido: "${value}" — use mm:ss.`,
      en: `Invalid duration format: "${value}" — use mm:ss.`,
      es: `Formato de duración no válido: "${value}" — use mm:ss.`,
    }[lang]),
    invalidYoutube: (value: string) => ({
      pt: `Link ou ID do YouTube inválido: "${value}".`,
      en: `Invalid YouTube URL or video ID: "${value}".`,
      es: `Enlace o ID de YouTube no válido: "${value}".`,
    }[lang]),
    invalidCcli: (value: string) => ({
      pt: `Número CCLI deve ser numérico, encontrado "${value}".`,
      en: `CCLI number must be numeric, found "${value}".`,
      es: `El número CCLI debe ser numérico, encontrado "${value}".`,
    }[lang]),
    invalidRepeat: (value: string) => ({
      pt: `Valor de repetição inválido: "${value}" — use um número positivo (ex.: 2 ou 2x).`,
      en: `Invalid repeat value: "${value}" — use a positive number (e.g. 2 or 2x).`,
      es: `Valor de repetición no válido: "${value}" — use un número positivo (ej.: 2 o 2x).`,
    }[lang]),
    invalidSize: (name: string, value: string) => ({
      pt: `Tamanho inválido para '${name}': "${value}".`,
      en: `Invalid size for '${name}': "${value}".`,
      es: `Tamaño no válido para '${name}': "${value}".`,
    }[lang]),
    invalidColor: (name: string, value: string) => ({
      pt: `Cor inválida para '${name}': "${value}".`,
      en: `Invalid color for '${name}': "${value}".`,
      es: `Color no válido para '${name}': "${value}".`,
    }[lang]),
  };
}

function analyzeBracketContent(
  content: string,
  lineIdx: number,
  startCol: number,
  endCol: number,
  lang: LintLanguage,
): ChordProDiagnostic[] {
  const trimmed = content.trim();
  const msg = getMessages(lang);

  if (trimmed === "") {
    return [
      {
        line: lineIdx,
        column: startCol,
        endColumn: endCol,
        severity: "warning",
        message: msg.emptyChord,
        code: "empty-chord",
      },
    ];
  }

  if (trimmed.startsWith("*")) return [];

  const diagnostics: ChordProDiagnostic[] = [];
  const analysis = analyzeChordSymbol(trimmed);
  if (!analysis.hasValidRoot) {
    diagnostics.push({
      line: lineIdx,
      column: startCol,
      endColumn: endCol,
      severity: "warning",
      message: msg.unknownChordRoot(trimmed),
      code: "unknown-chord-root",
    });
  } else if (!analysis.qualityRecognized) {
    diagnostics.push({
      line: lineIdx,
      column: startCol,
      endColumn: endCol,
      severity: "warning",
      message: msg.unknownChordQuality(trimmed),
      code: "unknown-chord-quality",
    });
  }

  return diagnostics;
}

function findBracketDiagnostics(line: string, lineIdx: number, lang: LintLanguage): ChordProDiagnostic[] {
  const diagnostics: ChordProDiagnostic[] = [];
  const msg = getMessages(lang);
  let depth = 0;
  let openIdx = -1;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "[") {
      if (depth === 0) openIdx = i;
      depth++;
    } else if (ch === "]") {
      if (depth === 0) {
        diagnostics.push({
          line: lineIdx,
          column: i,
          endColumn: i + 1,
          severity: "error",
          message: msg.unmatchedBracketClose,
          code: "unmatched-bracket-close",
        });
        continue;
      }
      depth--;
      if (depth === 0 && openIdx !== -1) {
        const content = line.slice(openIdx + 1, i);
        diagnostics.push(...analyzeBracketContent(content, lineIdx, openIdx, i + 1, lang));
        openIdx = -1;
      }
    }
  }

  if (depth > 0 && openIdx !== -1) {
    diagnostics.push({
      line: lineIdx,
      column: openIdx,
      endColumn: line.length,
      severity: "error",
      message: msg.unclosedBracket,
      code: "unclosed-bracket",
    });
  }

  return diagnostics;
}

export function lintChordPro(content: string, options?: LintOptions): ChordProDiagnostic[] {
  const lang = normalizeLang(options?.language);
  const msg = getMessages(lang);
  const lines = content.split(/\r?\n/);
  const diagnostics: ChordProDiagnostic[] = [];
  const blockStack: { name: string; line: number; rawName: string }[] = [];
  let inTab = false;
  let seenChorus = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") continue;

    if (trimmed.startsWith("{")) {
      if (!trimmed.endsWith("}")) {
        diagnostics.push({
          line: i,
          column: line.indexOf("{"),
          endColumn: line.length,
          severity: "error",
          message: msg.unclosedDirective,
          code: "unclosed-directive",
        });
        continue;
      }

      const directive = trimmed.slice(1, -1).trim();
      if (directive === "") {
        diagnostics.push({
          line: i,
          column: line.indexOf("{"),
          endColumn: line.lastIndexOf("}") + 1,
          severity: "warning",
          message: msg.emptyDirective,
          code: "empty-directive",
        });
        continue;
      }

      const colonIdx = directive.indexOf(":");
      const rawName = (colonIdx === -1 ? directive : directive.slice(0, colonIdx)).trim();
      const value = colonIdx === -1 ? "" : directive.slice(colonIdx + 1).trim();
      const lowerName = rawName.toLowerCase();
      const wholeDirectiveRange = {
        column: line.indexOf("{"),
        endColumn: line.lastIndexOf("}") + 1,
      };

      if (colonIdx === -1 && directive.includes(" ")) {
        const firstWord = directive.split(/\s+/)[0].toLowerCase();
        if (
          TEXT_METADATA_DIRECTIVES.has(firstWord) ||
          firstWord === "tempo" ||
          firstWord === "time" ||
          firstWord === "key" ||
          firstWord === "capo" ||
          firstWord === "keyshift" ||
          firstWord === "duration" ||
          firstWord === "youtube"
        ) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.missingColonSeparator(directive),
            code: "missing-colon-separator",
          });
          continue;
        }
      }

      if (lowerName === "start_of_version" || lowerName === "sov_ver") {
        seenChorus = false;
      }

      if (lowerName === "chorus" || lowerName === "ch") {
        if (!seenChorus) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.chorusRecallWithoutChorus,
            code: "chorus-recall-without-chorus",
          });
        }
        continue;
      }

      const blockStartName = resolveBlockStart(lowerName);
      if (blockStartName !== null) {
        if (blockStartName === "chorus") seenChorus = true;
        if (blockStartName === "tab") inTab = true;

        const top = blockStack[blockStack.length - 1];
        if (top && MAJOR_SECTIONS.has(blockStartName) && MAJOR_SECTIONS.has(top.name)) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.nestedSection(blockStartName, top.name, top.line + 1),
            code: "nested-section",
          });
        }

        blockStack.push({ name: blockStartName, line: i, rawName });
        continue;
      }

      const blockEndName = resolveBlockEnd(lowerName);
      if (blockEndName !== null) {
        if (blockEndName === "tab") inTab = false;
        const top = blockStack[blockStack.length - 1];

        if (!top) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.unmatchedBlockEnd(rawName, blockEndName),
            code: "unmatched-block-end",
          });
        } else if (top.name === blockEndName) {
          blockStack.pop();
        } else {
          let matchIdx = -1;
          for (let s = blockStack.length - 2; s >= 0; s--) {
            if (blockStack[s].name === blockEndName) {
              matchIdx = s;
              break;
            }
          }

          if (matchIdx !== -1) {
            diagnostics.push({
              line: i,
              ...wholeDirectiveRange,
              severity: "error",
              message: msg.interlockedBlocks(rawName, blockEndName, top.name, top.line + 1),
              code: "interlocked-blocks",
            });
            blockStack.splice(matchIdx, 1);
          } else {
            diagnostics.push({
              line: i,
              ...wholeDirectiveRange,
              severity: "warning",
              message: msg.mismatchedBlockEnd(top.name, top.line + 1, rawName),
              code: "mismatched-block-end",
            });
          }
        }
        continue;
      }

      if (TEXT_METADATA_DIRECTIVES.has(lowerName)) {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
      }

      if (COMMENT_DIRECTIVES.has(lowerName)) {
        const pipeIdx = value.indexOf("|");
        const commentText = (pipeIdx === -1 ? value : value.slice(0, pipeIdx)).trim();
        if (!commentText) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
      }

      if (lowerName === "tempo") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }

        const range = getValueRange(line, line.indexOf(":"), value);
        if (!/^\d+(\.\d+)?$/.test(value)) {
          diagnostics.push({
            line: i,
            ...range,
            severity: "warning",
            message: msg.nonNumericValue(rawName, value),
            code: "non-numeric-value",
          });
        } else {
          const n = Number(value);
          if (n < 20 || n > 400) {
            diagnostics.push({
              line: i,
              ...range,
              severity: "warning",
              message: msg.invalidTempoRange(value),
              code: "invalid-tempo-range",
            });
          }
        }
        continue;
      }

      if (lowerName === "time" || lowerName === "time_signature" || lowerName === "timesignature") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        if (!isValidTimeSignature(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidTimeSignature(value),
            code: "invalid-time-signature",
          });
        }
        continue;
      }

      if (lowerName === "key" || lowerName === "k" || lowerName === "original_key" || lowerName === "originalkey") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        if (!isValidKey(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidKey(value),
            code: "invalid-key",
          });
        }
        continue;
      }

      if (lowerName === "year") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        if (!isValidYear(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidYear(value),
            code: "invalid-year",
          });
        }
        continue;
      }

      if (lowerName === "duration") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        if (!isValidDuration(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidDuration(value),
            code: "invalid-duration",
          });
        }
        continue;
      }

      if (lowerName === "youtube") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        if (!isValidYouTube(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidYoutube(value),
            code: "invalid-youtube-value",
          });
        }
        continue;
      }

      if (lowerName === "capo") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        const n = parseInt(value, 10);
        if (!/^[0-9]+$/.test(value.trim()) || !Number.isInteger(n) || n < 0 || n > 11) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidCapoRange(value),
            code: "invalid-capo-range",
          });
        }
        continue;
      }

      if (lowerName === "keyshift" || lowerName === "key_shift" || lowerName === "ks") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        const n = parseInt(value, 10);
        if (!/^-?[0-9]+$/.test(value.trim()) || !Number.isInteger(n)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidKeyshiftValue(value),
            code: "invalid-keyshift-value",
          });
        }
        continue;
      }

      if (lowerName === "ccli") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        if (!isValidCcli(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidCcli(value),
            code: "invalid-ccli-number",
          });
        }
        continue;
      }

      if (lowerName === "repeat" || lowerName === "re") {
        if (value && !isValidRepeat(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidRepeat(value),
            code: "invalid-repeat-value",
          });
        }
        continue;
      }

      if (SIZE_DIRECTIVES.has(lowerName)) {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        if (!/^[1-9]\d*(?:\.\d+)?(?:pt|px)?$/i.test(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidSize(rawName, value),
            code: "invalid-size-value",
          });
        }
        continue;
      }

      if (COLOR_DIRECTIVES.has(lowerName)) {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
        if (!/^(#[0-9a-f]{3,8}|[a-z]+|rgb\([^)]+\)|rgba\([^)]+\))$/i.test(value)) {
          diagnostics.push({
            line: i,
            ...getValueRange(line, line.indexOf(":"), value),
            severity: "warning",
            message: msg.invalidColor(rawName, value),
            code: "invalid-color-value",
          });
        }
        continue;
      }

      if (lowerName === "define" || lowerName === "chord") {
        if (!value) {
          diagnostics.push({
            line: i,
            ...wholeDirectiveRange,
            severity: "warning",
            message: msg.emptyDirectiveValue(rawName),
            code: "empty-directive-value",
          });
          continue;
        }
      }

      continue;
    }

    if (trimmed.startsWith("#") && !inTab) continue;
    if (inTab) continue;

    diagnostics.push(...findBracketDiagnostics(line, i, lang));
  }

  for (const open of blockStack) {
    diagnostics.push({
      line: open.line,
      column: 0,
      severity: "warning",
      message: msg.unclosedBlock(open.name),
      code: "unclosed-block",
    });
  }

  return diagnostics;
}