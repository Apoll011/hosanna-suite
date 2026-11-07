/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { BookOpen, Code, Lightbulb, Search, Sparkles, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface SearchSyntaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExample?: (query: string) => void;
}

interface QueryExample {
  query: string;
  descriptionPt: string;
  descriptionEn: string;
  category: "basic" | "fields" | "numbers" | "boolean" | "regex";
}

const EXAMPLES: QueryExample[] = [
  {
    query: "graça",
    descriptionPt:
      "Pesquisa por palavra em qualquer campo (insensível a maiúsculas)",
    descriptionEn: "Search for word in any field (case-insensitive)",
    category: "basic",
  },
  {
    query: '"Amazing Grace"',
    descriptionPt: "Pesquisa por frase exata",
    descriptionEn: "Exact phrase search",
    category: "basic",
  },
  {
    query: "title:Graça",
    descriptionPt: "Pesquisa apenas no título",
    descriptionEn: "Search specifically in title field",
    category: "fields",
  },
  {
    query: "artist:Bethel",
    descriptionPt: "Pesquisa pelo artista / intérprete",
    descriptionEn: "Search by artist",
    category: "fields",
  },
  {
    query: "key:G",
    descriptionPt: "Filtrar por tom musical (ex: C, G, Em, F#)",
    descriptionEn: "Filter by musical key (e.g., C, G, Em, F#)",
    category: "fields",
  },
  {
    query: "tags:louvor",
    descriptionPt: "Filtrar por etiqueta / tag específica",
    descriptionEn: "Filter by tag / category",
    category: "fields",
  },
  {
    query: "folder:Hinos",
    descriptionPt: "Pesquisar pelo nome da pasta",
    descriptionEn: "Search by folder name",
    category: "fields",
  },
  {
    query: "year:>=2020",
    descriptionPt: "Cânticos do ano 2020 em diante",
    descriptionEn: "Songs from year 2020 onwards",
    category: "numbers",
  },
  {
    query: "year:[2000 TO 2023]",
    descriptionPt: "Intervalo de anos (inclusivo)",
    descriptionEn: "Year range (inclusive)",
    category: "numbers",
  },
  {
    query: "tempo:>120",
    descriptionPt: "Cânticos rápidos com andamento / BPM superior a 120",
    descriptionEn: "Fast songs with BPM > 120",
    category: "numbers",
  },
  {
    query: "duration:<300",
    descriptionPt: "Cânticos com duração inferior a 5 minutos (em segundos)",
    descriptionEn: "Songs shorter than 5 minutes (in seconds)",
    category: "numbers",
  },
  {
    query: "title:Rei AND artist:Morada",
    descriptionPt: "Combinar critérios obrigatórios (AND)",
    descriptionEn: "Combine required terms (AND)",
    category: "boolean",
  },
  {
    query: "key:C OR key:G",
    descriptionPt: "Qualquer um dos critérios (OR)",
    descriptionEn: "Either of the conditions (OR)",
    category: "boolean",
  },
  {
    query: "NOT tags:hinos",
    descriptionPt: "Excluir cânticos com certa etiqueta ou termo",
    descriptionEn: "Exclude songs with specific tag or keyword",
    category: "boolean",
  },
  {
    query: "title:A* AND NOT key:D",
    descriptionPt:
      "Wildcard (*) para títulos que comecem por 'A', exceto tom D",
    descriptionEn: "Wildcard (*) starting with 'A' excluding key D",
    category: "boolean",
  },
  {
    query: "title:/amor/i",
    descriptionPt: "Expressão regular (RegEx)",
    descriptionEn: "Regular expression matching",
    category: "regex",
  },
];

const SEARCHABLE_FIELDS: [string, string, string][] = [
  ["title", "Título do cântico", "Song title"],
  ["artist", "Artista ou autor", "Artist or author"],
  ["key", "Tom (ex: C, Dm, G, F#m)", "Key (e.g. C, Dm, G, F#m)"],
  ["tags", "Etiquetas associadas", "Associated tags"],
  ["folder", "Nome da pasta", "Folder name"],
  ["content", "Letra / Cifra ChordPro completa", "ChordPro lyrics and chords"],
  ["year", "Ano de composição / lançamento (número)", "Year (number)"],
  ["tempo", "BPM / Andamento (número)", "Tempo / BPM (number)"],
  ["duration", "Duração em segundos (número)", "Duration in seconds (number)"],
  ["song_number", "Número do cântico / hinário", "Song number in hymnbook"],
  ["composer", "Compositor", "Composer"],
  ["lyricist", "Letrista", "Lyricist"],
  ["album", "Álbum", "Album"],
  ["time", "Compasso (ex: 4/4, 6/8)", "Time signature (e.g. 4/4)"],
  ["capo", "Posição de Capo (ex: 2)", "Capo position (e.g. 2)"],
  ["ccli", "Número CCLI", "CCLI license number"],
];

export const SearchSyntaxModal: React.FC<SearchSyntaxModalProps> = ({
  isOpen,
  onClose,
  onApplyExample,
}) => {
  const { locale } = useI18n();
  const isPt = locale === "pt";
  const [filterCat, setFilterCat] = useState<string>("all");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: isPt ? "Todos" : "All" },
    { id: "basic", label: isPt ? "Básico" : "Basic" },
    { id: "fields", label: isPt ? "Campos" : "Fields" },
    {
      id: "numbers",
      label: isPt ? "Números e Intervalos" : "Numbers & Ranges",
    },
    { id: "boolean", label: isPt ? "Operadores (AND/OR/NOT)" : "Boolean" },
    { id: "regex", label: "RegEx / Wildcard" },
  ];

  const displayedExamples =
    filterCat === "all"
      ? EXAMPLES
      : EXAMPLES.filter((e) => e.category === filterCat);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-m3-card rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-m3-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-m3-border/60 bg-m3-sidebar/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-label text-m3-text flex items-center gap-2">
                {isPt
                  ? "Pesquisa Avançada (Liqe / Lucene)"
                  : "Advanced Search Syntax (Liqe / Lucene)"}
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-m3-primary/10 text-m3-primary font-bold">
                  LQL
                </span>
              </h2>
              <p className="text-[11px] text-m3-secondary font-medium">
                {isPt
                  ? "Pesquise por qualquer palavra ou utilize filtros precisos por campo, tom, ano e operadores."
                  : "Search freely or use precise filters by field, key, year, and boolean operators."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-m3-hover text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Quick Intro Banner */}
          <div className="p-4 bg-m3-primary/5 rounded-[var(--radius-xl)] border border-m3-primary/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-m3-primary shrink-0 mt-0.5" />
            <div className="text-xs text-m3-secondary leading-relaxed">
              <p className="font-bold text-m3-text mb-1">
                {isPt
                  ? "Pesquisa rápida em tempo real"
                  : "Real-time fast search"}
              </p>
              {isPt
                ? "Basta escrever termos normais (ex: 'graça') ou consultas com campo (ex: 'artist:Morada AND key:E'). Pode clicar em qualquer exemplo abaixo para o testar de imediato."
                : "Type terms normally (e.g. 'grace') or use field queries (e.g. 'artist:Bethel AND key:G'). Click any example below to apply it directly."}
            </div>
          </div>

          {/* Categories Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCat(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterCat === c.id
                    ? "bg-m3-primary text-white shadow-[var(--shadow-sm)]"
                    : "bg-m3-sidebar text-m3-secondary hover:bg-m3-hover"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            {/* Examples Column */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="flex items-center gap-2 text-label text-m3-primary mb-2">
                <Code className="w-4 h-4" />
                <span>{isPt ? "Exemplos Práticos" : "Practical Examples"}</span>
              </div>

              <div className="space-y-2">
                {displayedExamples.map((ex) => (
                  <div
                    key={ex.query}
                    onClick={() => {
                      if (onApplyExample) {
                        onApplyExample(ex.query);
                        onClose();
                      }
                    }}
                    className="p-2.5 rounded-xl border border-m3-border/60 bg-m3-sidebar/50 dark:bg-m3-sidebar/30 hover:border-m3-primary/40 hover:bg-m3-primary/5 transition-colors cursor-pointer group flex items-center justify-between gap-3"
                    title={
                      isPt
                        ? "Clique para usar na pesquisa"
                        : "Click to apply this search"
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <code className="text-xs font-mono font-bold text-m3-primary dark:text-m3-primary bg-m3-card border border-m3-border/80 px-2 py-0.5 rounded-lg inline-block truncate max-w-full">
                        {ex.query}
                      </code>
                      <p className="text-[11px] text-m3-secondary mt-1 truncate">
                        {isPt ? ex.descriptionPt : ex.descriptionEn}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-m3-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {isPt ? "Usar →" : "Apply →"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Fields Column */}
            <div className="md:col-span-5 space-y-2.5">
              <div className="flex items-center gap-2 text-label text-m3-primary mb-2">
                <BookOpen className="w-4 h-4" />
                <span>
                  {isPt ? "Campos Pesquisáveis" : "Searchable Fields"}
                </span>
              </div>

              <div className="border border-m3-border rounded-[var(--radius-xl)] overflow-hidden divide-y divide-m3-border/60 bg-m3-card text-xs">
                {SEARCHABLE_FIELDS.map(([field, descPt, descEn]) => (
                  <div
                    key={field}
                    className="p-2.5 flex items-center justify-between hover:bg-m3-hover transition-colors"
                  >
                    <code className="font-mono font-bold text-m3-primary text-[11px] bg-m3-sidebar px-1.5 py-0.5 rounded">
                      {field}:
                    </code>
                    <span className="text-[11px] text-m3-secondary text-right ml-2">
                      {isPt ? descPt : descEn}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-2.5 text-amber-700 dark:text-amber-400 text-[11px]">
                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isPt
                    ? 'Dica: Valores com espaços devem ser envolvidos em aspas duplas, ex: artist:"Diante do Trono".'
                    : 'Tip: Values containing spaces must be quoted, e.g. artist:"Hillsong Worship".'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
