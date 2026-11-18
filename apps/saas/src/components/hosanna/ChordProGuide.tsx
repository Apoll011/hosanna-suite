import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/useReveal";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Code2,
  Grid3x3,
  Keyboard,
  Layers,
  Lightbulb,
  MousePointerClick,
  Music2,
  Repeat,
  Tags,
} from "lucide-react";
import { useEffect, useState } from "react";

type DirectiveCategory = "metadata" | "comment" | "structure" | "notation";

interface DirectiveEntry {
  directive: string;
  alias?: string;
  category: DirectiveCategory;
  descriptionKey: string;
  example?: string;
  hosanna?: boolean;
}

const DIRECTIVES: DirectiveEntry[] = [
  {
    directive: "title",
    alias: "t",
    category: "metadata",
    descriptionKey: "title",
    example: "{title: Grandioso és Tu}",
  },
  {
    directive: "subtitle",
    alias: "st",
    category: "metadata",
    descriptionKey: "subtitle",
  },
  { directive: "artist", alias: "a", category: "metadata", descriptionKey: "artist" },
  {
    directive: "key",
    alias: "k",
    category: "metadata",
    descriptionKey: "key",
    example: "{key: A}",
  },
  {
    directive: "original_key",
    category: "metadata",
    descriptionKey: "original_key",
    hosanna: true,
  },
  {
    directive: "tempo",
    category: "metadata",
    descriptionKey: "tempo",
  },
  { directive: "time", category: "metadata", descriptionKey: "time" },
  {
    directive: "capo",
    category: "metadata",
    descriptionKey: "capo",
  },
  {
    directive: "key_shift",
    category: "metadata",
    descriptionKey: "keyshift",
    hosanna: true,
  },
  {
    directive: "duration",
    category: "metadata",
    alias: "duration",
    descriptionKey: "duration",
  },
  { directive: "album", category: "metadata", descriptionKey: "album" },
  { directive: "composer", category: "metadata", descriptionKey: "composer" },
  { directive: "arranger", category: "metadata", descriptionKey: "arranger", hosanna: true },
  { directive: "lyricist", category: "metadata", descriptionKey: "lyricist", hosanna: true },
  {
    directive: "copyright",
    category: "metadata",
    descriptionKey: "copyright",
  },
  { directive: "year", category: "metadata", descriptionKey: "year" },
  {
    directive: "youtube",
    category: "metadata",
    descriptionKey: "youtube",
    example: "{youtube: https://youtu.be/...}",
    hosanna: true,
  },
  {
    directive: "song_number",
    alias: "number",
    category: "metadata",
    descriptionKey: "song_number",
    example: "{song_number: 147}",
    hosanna: true,
  },
  {
    directive: "tags",
    category: "metadata",
    descriptionKey: "tags",
    example: "{tags: Adoration, Salvation, Gospel}",
    hosanna: true,
  },
  {
    directive: "comment",
    alias: "c",
    category: "comment",
    descriptionKey: "comment",
    example: "{comment: Intro: piano only}",
  },
  {
    directive: "comment_italic",
    alias: "ci",
    category: "comment",
    descriptionKey: "comment_italic",
  },
  {
    directive: "comment_box",
    alias: "cb",
    category: "comment",
    descriptionKey: "comment_box",
  },
  {
    directive: "start_of_verse",
    alias: "sov",
    category: "structure",
    descriptionKey: "start_of_verse",
    example: "{start_of_verse: Verse 1}",
  },
  {
    directive: "end_of_verse",
    alias: "eov",
    category: "structure",
    descriptionKey: "end_of_verse",
  },
  {
    directive: "start_of_chorus",
    alias: "soc",
    category: "structure",
    descriptionKey: "start_of_chorus",
    example: "{start_of_chorus: Refrão}",
  },
  {
    directive: "end_of_chorus",
    alias: "eoc",
    category: "structure",
    descriptionKey: "end_of_chorus",
  },
  {
    directive: "start_of_bridge",
    alias: "sob",
    category: "structure",
    descriptionKey: "start_of_bridge",
    example: "{start_of_bridge: Ponte}",
  },
  {
    directive: "end_of_bridge",
    alias: "eob",
    category: "structure",
    descriptionKey: "end_of_bridge",
  },
  {
    directive: "chorus",
    category: "structure",
    descriptionKey: "chorus_repeat",
    example: "{chorus}",
    hosanna: true,
  },
  {
    directive: "start_of_tab",
    alias: "sot",
    category: "notation",
    descriptionKey: "start_of_tab",
    example: "{start_of_tab: Guitar Riff}",
  },
  {
    directive: "end_of_tab",
    alias: "eot",
    category: "notation",
    descriptionKey: "end_of_tab",
  },
  {
    directive: "start_of_grid",
    alias: "sog",
    category: "notation",
    descriptionKey: "start_of_grid",
    example: "{start_of_grid: Intro}",
  },
  {
    directive: "end_of_grid",
    alias: "eog",
    category: "notation",
    descriptionKey: "end_of_grid",
  },
  {
    directive: "time_signature",
    category: "notation",
    descriptionKey: "time_signature",
    example: "{time_signature: 4/4}",
  },
];

const ESSENTIAL_DIRECTIVES = ["title", "artist", "key", "duration", "youtube", "song_number"];

function EyebrowIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="inline-flex p-3.5 rounded-2xl bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shadow-sm">
      <Icon className="w-8 h-8" />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  lede,
}: {
  icon: React.ElementType;
  title: string;
  lede?: React.ReactNode;
}) {
  return (
    <div className="space-y-4 reveal">
      <EyebrowIcon icon={icon} />
      <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
        {title}
      </h2>
      {lede && <p className="text-white/80 text-lg md:text-xl leading-relaxed max-w-3xl">{lede}</p>}
    </div>
  );
}

function HosannaBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-cyan-400 text-slate-950 px-2.5 py-0.5 rounded-full shrink-0">
      {t("common.exclusiveHosanna")}
    </span>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-8 px-2.5 py-1 rounded-lg bg-slate-800 border border-white/20 text-xs font-mono font-bold text-white shadow-sm">
      {children}
    </kbd>
  );
}

function CodeWindow({ filename, children }: { filename: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-950/90 rounded-2xl overflow-hidden shadow-2xl border border-white/15">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs sm:text-sm font-mono text-cyan-200/80 ml-2">{filename}</span>
        </div>
      </div>
      <div className="p-6 sm:p-8 font-mono text-sm leading-relaxed text-cyan-100 overflow-x-auto selection:bg-cyan-500/30">
        {children}
      </div>
    </div>
  );
}

function Callout({
  variant = "tip",
  title,
  children,
}: {
  variant?: "tip" | "warning";
  title: string;
  children: React.ReactNode;
}) {
  const isTip = variant === "tip";
  const Icon = isTip ? Lightbulb : AlertTriangle;
  return (
    <div
      className={`rounded-2xl border p-6 flex gap-4 ${
        isTip
          ? "bg-cyan-950/40 border-cyan-500/30 text-white"
          : "bg-amber-950/40 border-amber-500/30 text-white"
      }`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isTip ? "text-cyan-300" : "text-amber-300"}`} />
      <div>
        <div className={`font-bold mb-1 ${isTip ? "text-cyan-200" : "text-amber-200"}`}>
          {title}
        </div>
        <div className="text-white/80 leading-relaxed text-sm sm:text-base">{children}</div>
      </div>
    </div>
  );
}

function DirectiveCard({ entry }: { entry: DirectiveEntry }) {
  const { t } = useI18n();
  const desc = t(`directives.${entry.descriptionKey}` as TranslationKey);

  return (
    <div className="p-6 border border-white/15 bg-slate-900/60 backdrop-blur-md rounded-2xl hover:border-cyan-400/40 transition-all text-white shadow-xl relative">
      <div className="flex items-start justify-between gap-3 mb-2">
        <code className="text-cyan-300 font-bold text-lg block">{`{${entry.directive}: ...}`}</code>
        {entry.hosanna && <HosannaBadge />}
      </div>
      {entry.alias && (
        <div className="text-xs text-white/60 mb-2">
          {t("chordproGuide.shortcutLabel")}{" "}
          <code className="font-mono font-semibold text-cyan-200/90">{`${entry.alias} → Tab`}</code>
        </div>
      )}
      <p className="text-white/80 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

export function ChordProGuide() {
  useReveal();
  const { t, dict } = useI18n();
  const [activeId, setActiveId] = useState<string | null>(null);

  const TOC = [
    { id: "fundamentos", label: t("chordproGuide.toc.fundamentals") },
    { id: "sintaxe", label: t("chordproGuide.toc.syntax") },
    { id: "diretivas", label: t("chordproGuide.toc.directives") },
    { id: "estrutura", label: t("chordproGuide.toc.structure") },
    { id: "notas", label: t("chordproGuide.toc.grids") },
    { id: "tablatura", label: t("chordproGuide.toc.tablature") },
    { id: "atalhos", label: t("chordproGuide.toc.shortcuts") },
    { id: "referencia", label: t("chordproGuide.toc.reference") },
  ];

  useEffect(() => {
    const ids = TOC.map((item) => item.id);
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1, 0.25] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const CATEGORY_META: Record<
    DirectiveCategory,
    { label: string; icon: React.ElementType; chip: string; dot: string }
  > = {
    metadata: {
      label: t("chordproGuide.categories.metadata"),
      icon: Tags,
      chip: "bg-cyan-950/60 text-cyan-300 border-cyan-500/30",
      dot: "bg-cyan-400",
    },
    comment: {
      label: t("chordproGuide.categories.comment"),
      icon: ClipboardList,
      chip: "bg-amber-950/60 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400",
    },
    structure: {
      label: t("chordproGuide.categories.structure"),
      icon: Layers,
      chip: "bg-emerald-950/60 text-emerald-300 border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    notation: {
      label: t("chordproGuide.categories.notation"),
      icon: Grid3x3,
      chip: "bg-violet-950/60 text-violet-300 border-violet-500/30",
      dot: "bg-violet-400",
    },
  };

  return (
    <div className="bg-transparent min-h-screen selection:bg-cyan-400/20 font-sans relative z-10 text-white">
      <section
        id="top"
        className="pt-52 md:pt-64 pb-16 text-white relative overflow-hidden bg-transparent"
      >
        <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
          <h1 className="reveal text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display mb-8 tracking-tight">
            {t("chordproGuide.heroTitleStart")}{" "}
            <span className="text-cyan-300">{t("chordproGuide.heroTitleHighlight")}</span>
          </h1>
          <p className="reveal text-base sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto mb-14">
            {t("chordproGuide.heroSubtitle")}
          </p>

          <div className="reveal grid md:grid-cols-2 gap-5 text-left max-w-4xl mx-auto">
            <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/15 p-6 text-white">
              <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-200/70 mb-4">
                {t("chordproGuide.traditionalDoc")}
              </div>
              <div className="font-mono text-sm text-white/50 leading-loose whitespace-pre">
                {"  A            D\nLord my God, when I in awesome wonder"}
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {t("chordproGuide.traditionalWarning")}
              </div>
            </div>
            <div className="rounded-2xl bg-cyan-950/40 backdrop-blur-md border border-cyan-400/40 p-6 text-white">
              <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-300 mb-4">
                {t("chordproGuide.chordproInHosanna")}
              </div>
              <div className="font-mono text-sm leading-loose">
                Lord my <span className="text-cyan-300 font-bold">[A]</span>God, when I in{" "}
                <span className="text-cyan-300 font-bold">[D]</span>awesome wonder
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-cyan-200">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {t("chordproGuide.chordproSuccess")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lg:hidden sticky top-0 z-20 bg-slate-950/85 backdrop-blur-md border-b border-white/10">
        <div className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 text-sm font-medium text-white/80 hover:text-cyan-300 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <section className="py-16 bg-transparent">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-16 items-start">
            <nav
              className="sticky top-[calc(var(--site-header,4rem)+2rem)] hidden space-y-1 lg:block"
              aria-label={t("chordproGuide.tocTitle")}
            >
              <div className="mb-3 pl-3 text-[11px] font-bold uppercase tracking-widest text-cyan-200/70">
                {t("chordproGuide.tocTitle")}
              </div>
              {TOC.map((item, idx) => {
                const active = item.id === activeId;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    aria-current={active ? "location" : undefined}
                    className={
                      active
                        ? "flex items-center gap-3 rounded-full bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400 px-3 py-2.5 text-sm font-semibold"
                        : "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                    }
                  >
                    <span
                      className={
                        active
                          ? "w-4 font-mono text-xs text-cyan-300"
                          : "w-4 font-mono text-xs text-white/40"
                      }
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="grid gap-20 min-w-0">
              <div id="fundamentos" className="scroll-mt-28">
                <SectionHeader
                  icon={BookOpen}
                  title={t("chordproGuide.whatIsTitle")}
                  lede={t("chordproGuide.whatIsLede")}
                />
                <div className="text-white/80 text-base sm:text-lg leading-relaxed mt-6">
                  <p>{t("chordproGuide.whatIsParagraph")}</p>
                </div>
                <ul className="grid sm:grid-cols-2 gap-4 mt-8 list-none p-0 reveal">
                  {dict.chordproGuide.benefits.map((text: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/15 shadow-sm text-white"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="font-medium text-white text-sm sm:text-base leading-snug">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div id="sintaxe" className="scroll-mt-28">
                <SectionHeader
                  icon={Code2}
                  title={t("chordproGuide.anatomyTitle")}
                  lede={t("chordproGuide.anatomyLede")}
                />
                <div className="mt-8">
                  <CodeWindow filename="song-sample.chordpro">
                    <div className="text-slate-500 italic mb-2"># 1. Metadata</div>
                    <div>
                      <span className="text-cyan-400">{"{"}title:</span> How Great Thou Art
                      <span className="text-cyan-400">{"}"}</span>
                    </div>
                    <div>
                      <span className="text-cyan-400">{"{"}artist:</span> Classic Hymn
                      <span className="text-cyan-400">{"}"}</span>
                    </div>
                    <div>
                      <span className="text-cyan-400">{"{"}key:</span> A
                      <span className="text-cyan-400">{"}"}</span>
                    </div>
                    <div>
                      <span className="text-cyan-400">{"{"}tempo:</span> 72
                      <span className="text-cyan-400">{"}"}</span>
                    </div>
                    <br />
                    <div className="text-slate-500 italic mb-2"># 2. Sections</div>
                    <div>
                      <span className="text-cyan-400">{"{"}start_of_verse:</span> Verse 1
                      <span className="text-cyan-400">{"}"}</span>
                    </div>
                    <div>
                      O Lord my <span className="text-amber-400 font-bold">[A]</span>God, when I in
                      awesome <span className="text-amber-400 font-bold">[D]</span>wonder
                    </div>
                    <div>
                      Consider <span className="text-amber-400 font-bold">[A]</span>all the worlds
                      Thy
                      <span className="text-amber-400 font-bold">[E]</span>hands have
                      <span className="text-amber-400 font-bold">[A]</span>made
                    </div>
                    <div>
                      <span className="text-cyan-400">
                        {"{"}end_of_verse{"}"}
                      </span>
                    </div>
                  </CodeWindow>
                </div>
                <div className="mt-6">
                  <Callout title={t("chordproGuide.oneDirectiveTwoWaysTitle")}>
                    {t("chordproGuide.oneDirectiveTwoWaysDesc")}
                  </Callout>
                </div>
              </div>

              <div id="diretivas" className="scroll-mt-28">
                <SectionHeader
                  icon={Music2}
                  title={t("chordproGuide.essentialDirectivesTitle")}
                  lede={t("chordproGuide.essentialDirectivesLede")}
                />
                <div className="grid sm:grid-cols-2 gap-6 mt-8 reveal">
                  {ESSENTIAL_DIRECTIVES.map((key) => {
                    const entry = DIRECTIVES.find((d) => d.directive === key)!;
                    return <DirectiveCard key={key} entry={entry} />;
                  })}
                </div>
              </div>

              <div id="estrutura" className="scroll-mt-28">
                <SectionHeader
                  icon={Layers}
                  title={t("chordproGuide.structureTitle")}
                  lede={t("chordproGuide.structureLede")}
                />
                <div className="grid sm:grid-cols-3 gap-4 mt-8 reveal">
                  {[
                    {
                      tag: "verse",
                      label: dict.chordproGuide.sections.verse.label,
                      desc: dict.chordproGuide.sections.verse.desc,
                    },
                    {
                      tag: "chorus",
                      label: dict.chordproGuide.sections.chorus.label,
                      desc: dict.chordproGuide.sections.chorus.desc,
                    },
                    {
                      tag: "bridge",
                      label: dict.chordproGuide.sections.bridge.label,
                      desc: dict.chordproGuide.sections.bridge.desc,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-6 border border-white/15 bg-slate-900/60 backdrop-blur-md rounded-2xl shadow-xl text-white"
                    >
                      <div className="font-bold text-white text-lg mb-1">{item.label}</div>
                      <code className="text-xs text-cyan-300 font-mono bg-white/10 px-2 py-0.5 rounded">
                        {`{start_of_${item.tag}}`}
                      </code>
                      <p className="text-white/75 leading-relaxed mt-3 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 grid md:grid-cols-[1fr_1.1fr] gap-0 rounded-2xl border border-white/15 overflow-hidden shadow-2xl reveal">
                  <div className="p-8 bg-slate-900/80 backdrop-blur-md text-white">
                    <div className="inline-flex p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 shadow-sm mb-4">
                      <Repeat className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <code className="text-cyan-300 font-bold text-xl">{"{chorus}"}</code>
                      <HosannaBadge />
                    </div>
                    <p className="text-white/80 leading-relaxed text-sm">
                      {t("chordproGuide.chorusMagicDesc")}
                    </p>
                  </div>
                  <div className="p-8 bg-slate-950 font-mono text-sm text-cyan-100 leading-relaxed">
                    <div>
                      <span className="text-cyan-400">{"{start_of_chorus}"}</span>
                    </div>
                    <div>
                      Then sings my <span className="text-amber-400 font-bold">[E]</span>soul...
                    </div>
                    <div>
                      <span className="text-cyan-400">{"{end_of_chorus}"}</span>
                    </div>
                    <div className="text-slate-500 mt-5"># Verse 2 ...</div>
                    <div className="text-slate-500 mt-5">
                      # Instead of retyping the whole chorus:
                    </div>
                    <div className="text-emerald-400 font-bold mt-1">{"{chorus}"}</div>
                    <div className="text-slate-400 text-xs mt-1">
                      {t("chordproGuide.chorusMagicAutoNote")}
                    </div>
                  </div>
                </div>
              </div>

              <div id="notas" className="scroll-mt-28">
                <SectionHeader
                  icon={Grid3x3}
                  title={t("chordproGuide.gridsTitle")}
                  lede={t("chordproGuide.gridsLede")}
                />

                <div className="mt-8">
                  <CodeWindow filename="instrumental.chordpro">
                    <div className="text-slate-500 italic mb-2"># Intro</div>
                    <div>
                      <span className="text-cyan-400">
                        {"{start_of_grid:"} Intro{"}"}
                      </span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold">||</span> [A]{" "}
                      <span className="text-amber-400 font-bold">|</span> [D]{" "}
                      <span className="text-amber-400 font-bold">|</span> [E]{" "}
                      <span className="text-amber-400 font-bold">|</span> [A]{" "}
                      <span className="text-amber-400 font-bold">||</span>
                    </div>
                    <div>
                      <span className="text-cyan-400">{"{end_of_grid}"}</span>
                    </div>
                  </CodeWindow>
                </div>

                <div className="mt-6 reveal">
                  <div className="p-6 border border-white/15 rounded-2xl shadow-xl bg-slate-900/60 backdrop-blur-md text-white">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                      <Grid3x3 className="w-4 h-4 text-cyan-300" />{" "}
                      {t("chordproGuide.barlinesTitle")}
                    </h4>
                    <ul className="space-y-2 text-sm text-white/80 mt-4">
                      <li>
                        <code className="text-cyan-300">|</code> →{" "}
                        {t("chordproGuide.barlinesNormal")}
                      </li>
                      <li>
                        <code className="text-cyan-300">||</code> →{" "}
                        {t("chordproGuide.barlinesSection")}
                      </li>
                      <li>
                        <code className="text-cyan-300">|:</code>{" "}
                        {t("chordproGuide.barlinesRepeat")}{" "}
                        <code className="text-cyan-300">:|</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div id="tablatura" className="scroll-mt-28">
                <SectionHeader
                  icon={Music2}
                  title={t("chordproGuide.tabTitle")}
                  lede={t("chordproGuide.tabLede")}
                />
                <div className="mt-8">
                  <CodeWindow filename="riff-intro.chordpro">
                    <div>
                      <span className="text-cyan-400">{"{start_of_tab: Guitar Riff}"}</span>
                    </div>
                    <div className="text-cyan-100/90">e|-----------------0--2--3-------|</div>
                    <div className="text-cyan-100/90">B|-------0--1--3-----------------|</div>
                    <div className="text-cyan-100/90">G|----0--------------------------|</div>
                    <div className="text-cyan-100/90">D|-------------------------------|</div>
                    <div className="text-cyan-100/90">A|-------------------------------|</div>
                    <div className="text-cyan-100/90">E|-------------------------------|</div>
                    <div>
                      <span className="text-cyan-400">{"{end_of_tab}"}</span>
                    </div>
                  </CodeWindow>
                </div>
                <div className="mt-6">
                  <Callout variant="warning" title={t("chordproGuide.tabWarningTitle")}>
                    {t("chordproGuide.tabWarningDesc")}
                  </Callout>
                </div>
              </div>

              <div id="atalhos" className="scroll-mt-28">
                <SectionHeader
                  icon={Keyboard}
                  title={t("chordproGuide.shortcutsTitle")}
                  lede={t("chordproGuide.shortcutsLede")}
                />

                <div className="mt-10 reveal">
                  <div className="flex items-center gap-3 mb-2">
                    <Code2 className="w-6 h-6 text-cyan-300" />
                    <h3 className="text-2xl font-display font-bold text-white">
                      {t("chordproGuide.autocompleteTitle")}
                    </h3>
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed max-w-2xl text-sm sm:text-base">
                    {t("chordproGuide.autocompleteDesc")}
                  </p>
                </div>

                <div className="mt-14 reveal">
                  <div className="flex items-center gap-3 mb-2">
                    <MousePointerClick className="w-6 h-6 text-cyan-300" />
                    <h3 className="text-2xl font-display font-bold text-white">
                      {t("chordproGuide.selectAndWrapTitle")}
                    </h3>
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed max-w-2xl text-sm sm:text-base">
                    {t("chordproGuide.selectAndWrapDesc")}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      {
                        keys: ["Alt", "V"],
                        label: t("chordproGuide.createVerse"),
                        desc: t("chordproGuide.createVerseDesc"),
                      },
                      {
                        keys: ["Alt", "R"],
                        label: t("chordproGuide.createChorus"),
                        desc: t("chordproGuide.createChorusDesc"),
                      },
                      {
                        keys: ["Alt", "B"],
                        label: t("chordproGuide.createBridge"),
                        desc: t("chordproGuide.createBridgeDesc"),
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-6 border border-white/15 rounded-2xl shadow-xl bg-slate-900/60 backdrop-blur-md text-white"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          {item.keys.map((k, i) => (
                            <span key={i} className="flex items-center gap-2">
                              <Key>{k}</Key>
                              {i < item.keys.length - 1 && (
                                <span className="text-white/60 text-sm">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                        <div className="font-bold text-white mb-1">{item.label}</div>
                        <p className="text-white/70 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-14 reveal">
                  <div className="flex items-center gap-3 mb-2">
                    <Lightbulb className="w-6 h-6 text-cyan-300" />
                    <h3 className="text-2xl font-display font-bold text-white">
                      {t("chordproGuide.typeAndTabTitle")}
                    </h3>
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed max-w-2xl text-sm sm:text-base">
                    {t("chordproGuide.typeAndTabDesc")}
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { trigger: "!", result: "{title, key, bpm, verse, chorus}" },
                      { trigger: "t / title", result: "{title: ...}" },
                      { trigger: "a / artist", result: "{artist: ...}" },
                      { trigger: "k / key", result: "{key: ...}" },
                      { trigger: "tempo", result: "{tempo: 120}" },
                      { trigger: "youtube", result: "{youtube: url}" },
                      { trigger: "c / comment", result: "{comment: ...}" },
                      { trigger: "verse", result: "{start_of_verse} ... {end_of_verse}" },
                      { trigger: "chorus", result: "{start_of_chorus} ... {end_of_chorus}" },
                      { trigger: "bridge", result: "{start_of_bridge} ... {end_of_bridge}" },
                      { trigger: "tab", result: "{start_of_tab} ... {end_of_tab}" },
                      { trigger: "grid", result: "{start_of_grid} ... {end_of_grid}" },
                      { trigger: "||", result: "|| [ ] | [ ] | [ ] | [ ] ||" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-4 border border-white/15 rounded-xl bg-slate-900/60 backdrop-blur-md hover:border-cyan-400/40 transition-all shadow-sm text-white"
                      >
                        <code className="text-sm font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg shrink-0">
                          {item.trigger}
                        </code>
                        <span className="text-white/70 text-xs text-right truncate">
                          {item.result}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div id="referencia" className="scroll-mt-28">
                <SectionHeader
                  icon={BookMarked}
                  title={t("chordproGuide.quickRefTitle")}
                  lede={t("chordproGuide.quickRefLede")}
                />

                <div className="mt-10 grid gap-10 reveal">
                  {(Object.keys(CATEGORY_META) as DirectiveCategory[]).map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const entries = DIRECTIVES.filter((d) => d.category === cat);
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-4">
                          <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                          <h3 className="text-lg font-display font-bold text-white">
                            {meta.label}
                          </h3>
                          <span className="text-xs text-white/60">
                            {t("chordproGuide.directivesCount", { count: entries.length })}
                          </span>
                        </div>
                        <div className="rounded-2xl border border-white/15 overflow-hidden shadow-2xl bg-slate-900/60 backdrop-blur-md overflow-x-auto">
                          <table className="w-full text-sm min-w-150">
                            <tbody>
                              {entries.map((entry, idx) => (
                                <tr
                                  key={entry.directive}
                                  className={`border-b border-white/10 ${
                                    idx % 2 === 0 ? "bg-white/5" : "bg-transparent"
                                  }`}
                                >
                                  <td className="px-5 py-3.5 font-mono font-bold text-cyan-300 whitespace-nowrap">
                                    {`{${entry.directive}}`}
                                  </td>
                                  <td className="px-5 py-3.5 font-mono text-white/70 whitespace-nowrap">
                                    {entry.alias ? `{${entry.alias}}` : "—"}
                                  </td>
                                  <td className="px-5 py-3.5 text-white/85 leading-relaxed w-full">
                                    {t(`directives.${entry.descriptionKey}` as TranslationKey)}
                                  </td>
                                  <td className="px-5 py-3.5 text-right">
                                    {entry.hosanna && <HosannaBadge />}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 font-sans bg-transparent">
        <div className="container mx-auto px-6 text-center max-w-3xl reveal">
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-12 md:p-16 text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6 tracking-tight">
              {t("chordproGuide.ctaTitle")}
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed">
              {t("chordproGuide.ctaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="rounded-full bg-cyan-400 hover:bg-cyan-300 text-[#021433] font-semibold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all py-6 px-10"
              >
                {t("chordproGuide.ctaCreateSong")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 text-lg font-medium py-6 px-10"
                asChild
              >
                <Link to="/">{t("chordproGuide.ctaBackHome")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
