// SPDX-License-Identifier: AGPL-3.0-only
export async function registerChordproSnippets(aceInstance?: any): Promise<void> {
  let ace = aceInstance;
  if (!ace) {
    try {
      const mod = await import("ace-builds");
      ace = (mod as any).default || mod;
    } catch {
      return;
    }
  }

  if (!ace || typeof ace.define !== "function" || (ace as any)._chordproSnippetsRegistered) {
    return;
  }

  (ace as any).define(
    "ace/snippets/chordpro",
    ["require", "exports", "module"],
    (_: any, exports: any) => {
      exports.snippetText = [
        // ─── Template ──────────────────────────────────────────────────────────
        "snippet !",
        "\t{title: ${1:Título da Música}}",
        "\t{artist: ${2:Artista}}",
        "\t{key: ${3:C}}",
        "\t{tempo: ${4:120}}",
        "\t{time: ${5:4/4}}",
        "\t{capo: ${6:0}}",
        "\t{duration: ${7:3:30}}",
        "\t",
        "\t{start_of_verse: ${8:Verso 1}}",
        "\t[${9:Am}]${10:Letra da primeira linha}",
        "\t[${11:F}]${12:Letra da segunda linha}",
        "\t{end_of_verse}",
        "\t",
        "\t{start_of_chorus: ${13:Refrão}}",
        "\t[${14:C}]${15:Letra do refrão}",
        "\t[${16:G}]${17:Segunda linha do refrão}",
        "\t{end_of_chorus}",
        "\t",
        "\t{start_of_verse: ${18:Verso 2}}",
        "\t[${19:Am}]${20:Letra do segundo verso}",
        "\t{end_of_verse}",
        "\t",
        "\t{chorus}",

        // ─── Metadata directives ───────────────────────────────────────────────
        "snippet title",
        "\t{title: ${1:Título}}",

        "snippet t",
        "\t{title: ${1:Título}}",

        "snippet subtitle",
        "\t{subtitle: ${1:Subtítulo}}",

        "snippet st",
        "\t{subtitle: ${1:Subtítulo}}",

        "snippet artist",
        "\t{artist: ${1:Artista}}",

        "snippet a",
        "\t{artist: ${1:Artista}}",

        "snippet composer",
        "\t{composer: ${1:Compositor}}",

        "snippet lyricist",
        "\t{lyricist: ${1:Letrista}}",

        "snippet arranger",
        "\t{arranger: ${1:Arranjador}}",

        "snippet translator",
        "\t{translator: ${1:Tradutor}}",

        "snippet album",
        "\t{album: ${1:Álbum}}",

        "snippet year",
        "\t{year: ${1:2024}}",

        "snippet copyright",
        "\t{copyright: ${1:© ${2:2024} ${3:Artista}}}",

        "snippet ccli",
        "\t{ccli: ${1:0000000}}",

        "snippet key",
        "\t{key: ${1:C}}",

        "snippet k",
        "\t{key: ${1:C}}",

        "snippet original_key",
        "\t{original_key: ${1:C}}",

        "snippet capo",
        "\t{capo: ${1:0}}",

        "snippet keyshift",
        "\t{key_shift: ${1:0}}",

        "snippet tempo",
        "\t{tempo: ${1:120}}",

        "snippet time",
        "\t{time: ${1:4/4}}",

        "snippet duration",
        "\t{duration: ${1:3}:${2:30}}",

        "snippet youtube",
        "\t{youtube: ${1:https://youtu.be/xxxxxxxxxxx}}",

        "snippet song_number",
        "\t{song_number: ${1:1}}",

        "snippet number",
        "\t{song_number: ${1:1}}",

        "snippet tags",
        "\t{tags: ${1:tag1, tag2}}",

        "snippet keynote",
        "\t{key_note: ${1:Nota sobre modulação ou tonalidade}}",

        "snippet meta",
        "\t{meta: ${1:campo} ${2:valor}}",

        // ─── Comment directives ────────────────────────────────────────────────
        "snippet comment",
        "\t{comment: ${1:Comentário}}",

        "snippet ci",
        "\t{comment_italic: ${1:Comentário em itálico}}",

        "snippet comment_italic",
        "\t{comment_italic: ${1:Comentário em itálico}}",

        "snippet comment_box",
        "\t{comment_box: ${1:Comentário em caixa}}",

        // ─── Chorus ────────────────────────────────────────────────────────────
        "snippet chorus",
        "\t{start_of_chorus: ${1:Refrão}}",
        "\t${2:[Acorde]Letra do refrão}",
        "\t{end_of_chorus}",

        "snippet soc",
        "\t{start_of_chorus}",

        "snippet eoc",
        "\t{end_of_chorus}",

        "snippet cc",
        "\t{chorus}",

        "snippet repeat_chorus",
        "\t{chorus}",

        // ─── Verse ─────────────────────────────────────────────────────────────
        "snippet verse",
        "\t{start_of_verse: ${1:Verso} ${2:1}}",
        "\t${3:[Acorde]Letra do verso}",
        "\t{end_of_verse}",

        "snippet sov",
        "\t{start_of_verse}",

        "snippet eov",
        "\t{end_of_verse}",

        // ─── Bridge ────────────────────────────────────────────────────────────
        "snippet bridge",
        "\t{start_of_bridge: ${1:Ponte}}",
        "\t${2:[Acorde]Letra da ponte}",
        "\t{end_of_bridge}",

        "snippet sob",
        "\t{start_of_bridge}",

        "snippet eob",
        "\t{end_of_bridge}",

        // ─── Intro ─────────────────────────────────────────────────────────────
        "snippet intro",
        "\t{start_of_part: ${1:Intro}}",
        "\t${2:[Acorde]Introdução}",
        "\t{end_of_part}",

        // ─── Outro ─────────────────────────────────────────────────────────────
        "snippet outro",
        "\t{start_of_outro: ${1:Final}}",
        "\t${2:[Acorde]Encerramento}",
        "\t{end_of_outro}",

        "snippet soe",
        "\t{start_of_outro}",

        "snippet eoe",
        "\t{end_of_outro}",

        // ─── Lead / Refrain / Middle ───────────────────────────────────────────
        "snippet lead",
        "\t{start_of_lead: ${1:Solo}}",
        "\t${2:[Acorde]}",
        "\t{end_of_lead}",

        "snippet sol",
        "\t{start_of_lead}",

        "snippet eol",
        "\t{end_of_lead}",

        "snippet refrain",
        "\t{start_of_refrain: ${1:Refrão}}",
        "\t${2:[Acorde]Letra}",
        "\t{end_of_refrain}",

        "snippet sor",
        "\t{start_of_refrain}",

        "snippet eor",
        "\t{end_of_refrain}",

        "snippet middle",
        "\t{start_of_middle: ${1:Interlúdio}}",
        "\t${2:[Acorde]Letra}",
        "\t{end_of_middle}",

        "snippet som",
        "\t{start_of_middle}",

        "snippet eom",
        "\t{end_of_middle}",

        "snippet part",
        "\t{start_of_part: ${1:Secção}}",
        "\t${2:[Acorde]Letra}",
        "\t{end_of_part}",

        "snippet sop",
        "\t{start_of_part}",

        "snippet eop",
        "\t{end_of_part}",

        // ─── Version ───────────────────────────────────────────────────────────
        "snippet version",
        "\t{start_of_version: ${1:Nome da Versão}}",
        "\t${2:}",
        "\t{end_of_version}",

        // ─── Tab block ─────────────────────────────────────────────────────────
        "snippet tab",
        "\t{start_of_tab}",
        "\te|${1:--}-----|",
        "\tB|--------|",
        "\tG|--------|",
        "\tD|--------|",
        "\tA|--------|",
        "\tE|--------|",
        "\t{end_of_tab}",

        "snippet sot",
        "\t{start_of_tab}",

        "snippet eot",
        "\t{end_of_tab}",

        // ─── Grid block ────────────────────────────────────────────────────────
        "snippet grid",
        "\t{start_of_grid}",
        "\t||[${1:Em}]|[${2:C}]|[${3:D}]|[${4:G}]||",
        "\t{end_of_grid}",

        "snippet sog",
        "\t{start_of_grid}",

        "snippet eog",
        "\t{end_of_grid}",

        // ─── Chord / lyric helpers ─────────────────────────────────────────────
        "snippet [",
        "\t[${1:Am}]${2:}",

        "snippet ||",
        "\t||[${1:Am}]|[${2:C}]|[${3:G}]|[${4:F}]||",

        "snippet repeat",
        "\t{repeat: ${1:2}}",

        "snippet re",
        "\t{repeat: ${1:2}}",

        // ─── Chord define ──────────────────────────────────────────────────────
        "snippet define",
        "\t{define: ${1:Am} base-fret ${2:1} frets ${3:x 0 2 2 1 0}}",

        "snippet d",
        "\t{define: ${1:Am} base-fret ${2:1} frets ${3:x 0 2 2 1 0}}",

        // ─── Layout / presentation ─────────────────────────────────────────────
        "snippet column_break",
        "\t{column_break}",

        "snippet cb",
        "\t{column_break}",

        "snippet new_page",
        "\t{new_page}",

        "snippet np",
        "\t{new_page}",

        "snippet new_physical_page",
        "\t{new_physical_page}",

        // ─── Typography ────────────────────────────────────────────────────────
        "snippet textsize",
        "\t{textsize: ${1:12}}",

        "snippet chordsize",
        "\t{chordsize: ${1:10}}",

        "snippet tabsize",
        "\t{tabsize: ${1:10}}",

        "snippet gridsize",
        "\t{gridsize: ${1:10}}",

        "snippet textcolor",
        "\t{textcolor: ${1:#000000}}",

        "snippet chordcolor",
        "\t{chordcolor: ${1:#1a56db}}",
      ].join("\n");
      exports.scope = "chordpro";
    },
  );

  (ace as any)._chordproSnippetsRegistered = true;
}
