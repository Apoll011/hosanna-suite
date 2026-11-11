import { DIRECTIVE_ALIAS_MAP, KNOWN_DIRECTIVES } from "../formatter/directives";

/** Strip incidental braces Ace may include when tokenizing `{start_of_verse}`. */
export function normalizeCompletionWord(word: string): string {
  return word.trim().replace(/^\{+/, "").replace(/\}+$/, "").toLowerCase();
}

/**
 * True when a local/document word is a ChordPro directive name (or long alias).
 * Short 1-char aliases (t, a, c, k, …) are left alone so lyric letters still complete.
 */
export function isDirectiveCompletionWord(word: string): boolean {
  const w = normalizeCompletionWord(word);
  if (!w) return false;
  if (/^(start|end)_of_[a-z0-9_]+$/.test(w)) return true;
  if (KNOWN_DIRECTIVES.has(w)) return true;
  if (w.length >= 2 && Object.prototype.hasOwnProperty.call(DIRECTIVE_ALIAS_MAP, w)) {
    return true;
  }
  return false;
}

export function filterOutDirectiveLocals<T extends { value?: string; caption?: string }>(
  results: T[] | null | undefined,
): T[] {
  if (!results?.length) return [];
  return results.filter((item) => !isDirectiveCompletionWord(item.value || item.caption || ""));
}

/** Names suggested by the dedicated directive completer (canonical + long aliases). */
export function directiveSuggestionNames(): string[] {
  const names = new Set<string>(KNOWN_DIRECTIVES);
  for (const [alias, canonical] of Object.entries(DIRECTIVE_ALIAS_MAP)) {
    if (alias.length >= 2) names.add(alias);
    names.add(canonical);
  }
  return [...names].sort();
}

export type AceCompletionCallback = (
  err: Error | null,
  results: Array<{ caption: string; value: string; score: number; meta: string }>,
) => void;

/** Suggest known directives as first-class completions (not document "local" words). */
export function createDirectiveCompleter() {
  const names = directiveSuggestionNames();
  return {
    id: "chordproDirectiveCompleter",
    getCompletions(
      _editor: unknown,
      _session: unknown,
      _pos: unknown,
      _prefix: string,
      callback: AceCompletionCallback,
    ) {
      callback(
        null,
        names.map((name) => ({
          caption: name,
          value: name,
          score: 1000,
          meta: "directive",
        })),
      );
    },
  };
}

/** Wrap Ace's textCompleter so directive names never appear as meta: "local". */
export function createFilteredTextCompleter(textCompleter: {
  getCompletions: (
    editor: unknown,
    session: unknown,
    pos: unknown,
    prefix: string,
    callback: (err: Error | null, results?: Array<{ value?: string; caption?: string }>) => void,
  ) => void;
}) {
  return {
    id: "textCompleter",
    getCompletions(
      editor: unknown,
      session: unknown,
      pos: unknown,
      prefix: string,
      callback: (err: Error | null, results?: unknown[]) => void,
    ) {
      textCompleter.getCompletions(editor, session, pos, prefix, (err, results) => {
        if (err) {
          callback(err, results);
          return;
        }
        callback(null, filterOutDirectiveLocals(results));
      });
    },
  };
}
