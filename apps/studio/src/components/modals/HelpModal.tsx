import { useI18n } from "@/src/lib/i18n";
import { Keyboard, Lightbulb, X } from "lucide-react";
import React, { useEffect } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SNIPPETS: [string, string][] = [
  ["!", "Molde completo de novo cântico"],
  ["t ou title", "{title: ...}"],
  ["sb ou subtitle", "{subtitle: ...}"],
  ["a ou artist", "{artist: ...}"],
  ["k ou key", "{key: C}"],
  ["tempo", "{tempo: 120}"],
  ["duration", "{duration: 4:00}"],
  ["capo", "{capo: ...}"],
  ["youtube", "{youtube: url}"],
  ["c ou comment", "{comment: ...}"],
  ["cb ou column", "{column_break}"],
  ["cc", "{chorus} (Repete o último refrão)"],
  ["chorus", "Bloco de Refrão {start_of_chorus...}"],
  ["verse", "Bloco de Verso {start_of_verse...}"],
  ["bridge", "Bloco de Ponte {start_of_bridge...}"],
  ["tab", "Bloco de Tablatura {start_of_tab...}"],
  ["soc / eoc", "Inicia / Termina Refrão"],
  ["sov / eov", "Inicia / Termina Verso"],
  ["sob / eob", "Inicia / Termina Ponte"],
  ["sot / eot", "Inicia / Termina Tablatura"],
  ["d ou define", "{define: ...}"],
  ["album", "{album: ...}"],
  ["arranger", "{arranger: ...}"],
  ["composer", "{composer: ...}"],
  ["copyright", "{copyright: ...}"],
  ["lyricist", "{lyricist: ...}"],
  ["year", "{year: 2024}"],
  ["meta", "{meta: etiqueta valor}"],
];

const SHORTCUTS: [string, string][] = [
  ["CTRL + S", "Guardar o cântico"],
  ["ALT + V", "Envolver seleção num Verso"],
  ["ALT + R", "Envolver seleção num Refrão"],
  ["ALT + B", "Envolver seleção numa Ponte"],
  ["CTRL + ESPAÇO", "Sugerir acordes já usados (↓/↑ e ENTER)"],
  ["CTRL + F", "Pesquisar no texto"],
  ["CTRL + H", "Pesquisar e Substituir"],
  ["CTRL + D", "Remover linha atual"],
  ["CTRL + SHIFT + D", "Duplicar linha ou seleção"],
  ["ALT + SHIFT + ↑", "Copiar linha para cima"],
  ["ALT + SHIFT + ↓", "Copiar linha para baixo"],
  ["ALT + 0", "Colapsar todas as secções"],
  ["ALT + SHIFT + 0", "Expandir todas as secções"],
  ["ESC", "Fechar pesquisa, sugestões ou esta janela"],
];

// Componente visual para as teclas
const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-md bg-m3-card border border-m3-border shadow-[0_2px_0_0_rgba(15,23,42,0.1)] dark:shadow-[0_2px_0_0_rgba(0,0,0,0.5)] text-[10px] sm:text-xs font-mono font-bold text-m3-text">
    {children}
  </kbd>
);

// Função auxiliar para renderizar combinações de teclas bonitas
const renderShortcut = (shortcut: string) => {
  return shortcut.split(" + ").map((key, index, array) => (
    <React.Fragment key={key}>
      <Key>{key}</Key>
      {index < array.length - 1 && (
        <span className="text-m3-secondary text-xs">+</span>
      )}
    </React.Fragment>
  ));
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

  // Fechar no ESCape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-m3-card rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-m3-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-m3-border/60 bg-m3-sidebar/50">
          <h2 className="text-label text-m3-primary flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            {t("misc.help.title")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-m3-hover text-m3-secondary hover:text-m3-text transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="overflow-y-auto p-6 grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Coluna 1: Snippets */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-m3-primary">
              <h3 className="text-lg font-bold">
                {t("misc.help.smartSnippets")}
              </h3>
            </div>
            <p className="text-xs text-m3-secondary mb-5 leading-relaxed">
              Escreva uma das siglas abaixo numa linha vazia e prima{" "}
              <Key>TAB</Key> para o editor preencher automaticamente.
            </p>

            <div className="space-y-1.5">
              {SNIPPETS.map(([trigger, result]) => (
                <div
                  key={trigger}
                  className="flex items-center justify-between py-2 border-b border-m3-border/60 group hover:bg-m3-hover px-2 -mx-2 rounded-lg transition-colors"
                >
                  <code className="text-[11px] sm:text-xs font-mono font-bold text-m3-primary bg-m3-primary/10 dark:bg-m3-primary/15 px-2 py-1 rounded">
                    {trigger}
                  </code>
                  <span className="text-[11px] sm:text-xs text-m3-secondary text-right">
                    {result}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-m3-primary/10 dark:bg-m3-primary/10 rounded-xl border border-m3-primary/20 dark:border-m3-primary/20 flex gap-3">
              <Lightbulb className="w-5 h-5 text-m3-primary shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-m3-secondary leading-relaxed">
                <strong className="text-m3-primary">
                  {t("misc.help.tipTitle")}{" "}
                </strong>
                {t("misc.help.tipDesc")}
              </p>
            </div>
          </div>

          {/* Coluna 2: Atalhos */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-m3-primary">
              <Keyboard className="w-5 h-5" />
              <h3 className="text-lg font-bold">
                {t("misc.help.shortcutsTitle")}
              </h3>
            </div>
            <p className="text-xs text-m3-secondary mb-5 leading-relaxed">
              {t("misc.help.shortcutsDesc")}
            </p>

            <div className="space-y-1.5">
              {SHORTCUTS.map(([key, action]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2.5 border-b border-m3-border/60 group hover:bg-m3-hover px-2 -mx-2 rounded-lg transition-colors gap-4"
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    {renderShortcut(key)}
                  </div>
                  <span className="text-[11px] sm:text-xs text-m3-secondary text-right leading-snug">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
