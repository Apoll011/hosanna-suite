import { ChordFinder, type ChordOccurrence } from "./ChordFinder";

type AcePosition = { row: number; column: number };

type AceSession = {
  getLine(row: number): string;
  on?(event: "change", listener: () => void): void;
};

type AceEditor = {
  getValue(): string;
  session?: AceSession | null;
};

type AceCompletionCallback = (err: Error | null, results: ChordOccurrence[]) => void;

export function isInsideChordBracket(
  session: AceSession | null | undefined,
  pos: AcePosition | null | undefined,
): boolean {
  if (!session || typeof session.getLine !== "function" || !pos) return false;
  const line = session.getLine(pos.row) ?? "";
  const beforeCursor = line.slice(0, pos.column);
  return beforeCursor.lastIndexOf("[") > beforeCursor.lastIndexOf("]");
}

export function createChordCompletionCache() {
  const revisions = new WeakMap<AceSession, number>();
  const entries = new WeakMap<AceSession, { revision: number; chords: ChordOccurrence[] }>();
  const observed = new WeakSet<AceSession>();

  const observe = (session: AceSession) => {
    if (observed.has(session)) return;
    observed.add(session);
    session.on?.("change", () => {
      revisions.set(session, (revisions.get(session) ?? 0) + 1);
    });
  };

  return {
    get(
      editor: AceEditor,
      session: AceSession | null | undefined = editor.session,
    ): ChordOccurrence[] {
      if (!editor || typeof editor.getValue !== "function") return [];
      const activeSession = session ?? editor.session ?? null;
      if (!activeSession) return ChordFinder.getChords(editor.getValue());

      observe(activeSession);
      const revision = revisions.get(activeSession) ?? 0;
      const cached = entries.get(activeSession);
      if (cached?.revision === revision) return cached.chords;

      const chords = ChordFinder.getChords(editor.getValue());
      entries.set(activeSession, { revision, chords });
      return chords;
    },
  };
}

export function createChordCompleter(cache = createChordCompletionCache()) {
  return {
    id: "chordproChordCompleter",

    getCompletions(
      editor: AceEditor | null | undefined,
      session: AceSession | null | undefined,
      pos: AcePosition | null | undefined,
      _prefix: string,
      callback: AceCompletionCallback,
    ) {
      if (!editor || typeof editor.getValue !== "function" || !isInsideChordBracket(session, pos)) {
        callback(null, []);
        return;
      }

      callback(null, cache.get(editor, session));
    },
  };
}
