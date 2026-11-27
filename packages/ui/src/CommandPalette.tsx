"use client";

import type { Interpolation, Language } from "@hosanna/i18n";
import {
  ChevronRight,
  Command,
  CornerDownLeft,
  History,
  Loader2,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "./cn";
import { sharedUiT } from "./sharedT";
import { useCommandPalette, type CommandAction } from "./CommandPaletteContext";
import { usePresence } from "./usePresence";

export interface CommandPaletteProps {
  isSearching?: boolean;
  language?: Language;
  translate?: (key: string, values?: Interpolation) => string;
  className?: string;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={index} className="font-semibold text-m3-primary underline underline-offset-2">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

export function CommandPalette({
  isSearching = false,
  language,
  translate,
  className,
}: CommandPaletteProps) {
  const {
    isOpen,
    closePalette,
    searchQuery,
    setSearchQuery,
    activeParentId,
    setActiveParentId,
    recordRecentAction,
    recentActionIds,
    allActions,
  } = useCommandPalette();
  const t = useMemo(() => {
    const fallback = sharedUiT(language);
    return (key: string, values?: Interpolation) => {
      const hostCopy = translate?.(key, values);
      if (hostCopy && hostCopy !== key) return hostCopy;
      const leaf = key.split(".").at(-1);
      return fallback(`suite.commandPalette.${leaf === "recents" ? "recent" : leaf}`, values);
    };
  }, [language, translate]);
  const dialogId = useId();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const mounted = usePresence(isOpen, 190);

  const [previousOpen, setPreviousOpen] = useState(isOpen);
  const [previousParentId, setPreviousParentId] = useState(activeParentId);
  const [previousQuery, setPreviousQuery] = useState(searchQuery);
  if (isOpen !== previousOpen || activeParentId !== previousParentId) {
    setPreviousOpen(isOpen);
    setPreviousParentId(activeParentId);
    if (isOpen) setSelectedIndex(0);
  }
  if (searchQuery !== previousQuery) {
    setPreviousQuery(searchQuery);
    setSelectedIndex(0);
  }

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      if (!isOpenRef.current) previouslyFocused?.focus();
    };
  }, [activeParentId, isOpen]);

  const filteredActions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const pool = allActions.filter((action) =>
      activeParentId ? action.parent === activeParentId : !action.parent,
    );
    if (!query) {
      if (!activeParentId && recentActionIds.length > 0) {
        const recent: CommandAction[] = [];
        for (const id of recentActionIds) {
          const action = pool.find((candidate) => candidate.id === id);
          if (action)
            recent.push({
              ...action,
              id: `recent-${action.id}`,
              section: t("palette.recents"),
              icon: <History className="h-4 w-4" />,
            });
        }
        return [...recent, ...pool.filter((action) => !recentActionIds.includes(action.id))];
      }
      return pool;
    }
    return pool.filter((action) => {
      if (action.id === "ai-ask") return true;
      return [action.name, action.keywords, action.subtitle, action.section].some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [activeParentId, allActions, recentActionIds, searchQuery, t]);

  const groups = useMemo(() => {
    const sections: { name: string; actions: CommandAction[] }[] = [];
    for (const action of filteredActions) {
      const name = action.section || t("palette.defaultSection");
      let section = sections.find((candidate) => candidate.name === name);
      if (!section) {
        section = { name, actions: [] };
        sections.push(section);
      }
      section.actions.push(action);
    }
    return sections;
  }, [filteredActions, t]);
  const visibleActions = useMemo(() => groups.flatMap((group) => group.actions), [groups]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-action-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const executeAction = (action: CommandAction) => {
    recordRecentAction(action.id.replace(/^recent-/, ""));
    action.perform?.();
    closePalette();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (activeParentId) setActiveParentId(null);
      else closePalette();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % Math.max(visibleActions.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (index) => (index - 1 + visibleActions.length) % Math.max(visibleActions.length, 1),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const action = visibleActions[selectedIndex];
      if (action) executeAction(action);
    } else if (event.key === "Backspace" && !searchQuery && activeParentId) {
      event.preventDefault();
      setActiveParentId(null);
    }
  };

  if (!mounted) return null;

  let globalIndex = 0;
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 pt-[8vh] backdrop-blur-sm transition-opacity duration-200 sm:pt-[11vh]",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!isOpen}
      inert={!isOpen}
      onClick={closePalette}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        className={cn(
          "w-full max-w-2xl overflow-hidden rounded-2xl border border-m3-border/80 bg-m3-card shadow-2xl transition-[transform,opacity] duration-200 [transition-timing-function:cubic-bezier(.2,.8,.2,1)]",
          isOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-[.985] opacity-0",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="relative flex min-h-16 items-center gap-3 border-b border-m3-border px-4 py-3 sm:px-5">
          <Search className="h-5 w-5 shrink-0 text-m3-primary" aria-hidden="true" />
          {activeParentId && (
            <div className="mr-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-m3-primary-light/60 px-2 py-1 text-xs font-semibold text-m3-primary dark:bg-m3-primary-dark">
              <span>{t("palette.submenu")}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
            </div>
          )}
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-label={t("palette.searchPlaceholder")}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={`${dialogId}-results`}
            aria-activedescendant={
              visibleActions.length ? `${dialogId}-option-${selectedIndex}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t(activeParentId ? "palette.searchSubmenu" : "palette.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-m3-text outline-none placeholder:text-m3-input focus-visible:ring-0"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label={t("palette.clearSearch")}
              onClick={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              className="rounded-md p-1.5 text-m3-secondary transition-colors hover:bg-m3-hover hover:text-m3-text"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {isSearching ? (
            <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-m3-hover px-2 py-1 text-[10px] text-m3-secondary">
              <Loader2 className="h-3 w-3 animate-spin text-m3-primary" aria-hidden="true" />
              <span>Search</span>
            </div>
          ) : (
            <kbd className="hidden shrink-0 rounded-md border border-m3-border bg-m3-sidebar px-2 py-1 text-[10px] font-mono font-medium text-m3-secondary sm:inline-block">
              ESC
            </kbd>
          )}
        </div>

        <div
          id={`${dialogId}-results`}
          ref={listRef}
          role="listbox"
          className="max-h-[min(55vh,30rem)] overflow-y-auto py-2"
        >
          {visibleActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-m3-hover">
                <SearchX className="h-6 w-6 text-m3-secondary" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-m3-text">{t("palette.noResults")}</p>
              <p className="mt-1 max-w-70 text-xs text-m3-secondary">
                {t("palette.noResultsDesc", { query: searchQuery })}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.name} className="mb-2 last:mb-0">
                <div className="px-5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[.12em] text-m3-secondary">
                  {group.name}
                </div>
                {group.actions.map((action) => {
                  const index = globalIndex++;
                  const selected = index === selectedIndex;
                  return (
                    <button
                      key={action.id}
                      id={`${dialogId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-action-index={index}
                      onClick={() => executeAction(action)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "mx-2 my-0.5 flex min-h-12 w-[calc(100%-1rem)] items-center justify-between rounded-xl px-3 text-left transition-[background-color,transform,color] duration-150",
                        selected
                          ? "bg-m3-primary-light/50 text-m3-text dark:bg-m3-primary-dark/50"
                          : "text-m3-text/90 hover:bg-m3-hover",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3 pr-2">
                        {action.isLoading ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-m3-primary" />
                        ) : action.icon ? (
                          <span className="flex shrink-0 items-center justify-center">
                            {action.icon}
                          </span>
                        ) : null}
                        <span className="flex min-w-0 flex-col">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">
                              <HighlightText text={action.name} query={searchQuery} />
                            </span>
                            {action.badge && (
                              <span className="rounded bg-m3-hover px-1.5 py-0.5 text-[10px] font-mono text-m3-secondary">
                                {action.badge}
                              </span>
                            )}
                          </span>
                          {action.subtitle && (
                            <span className="truncate text-xs text-m3-secondary">
                              <HighlightText text={action.subtitle} query={searchQuery} />
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {action.shortcut?.length ? (
                          action.shortcut.map((key) => (
                            <kbd
                              key={key}
                              className="rounded border border-m3-border bg-m3-sidebar px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase text-m3-secondary"
                            >
                              {key}
                            </kbd>
                          ))
                        ) : selected ? (
                          <CornerDownLeft
                            className="h-3.5 w-3.5 text-m3-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <footer
          id={`${dialogId}-title`}
          className="flex items-center justify-between border-t border-m3-border bg-m3-toolbar px-4 py-2.5 text-[11px] text-m3-secondary sm:px-5"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-m3-border bg-m3-card px-1 py-0.5">↑</kbd>
              <kbd className="rounded border border-m3-border bg-m3-card px-1 py-0.5">↓</kbd>
              {t("palette.navigate")}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-m3-border bg-m3-card px-1 py-0.5">↵</kbd>
              {t("palette.select")}
            </span>
          </div>
          <span className="flex items-center gap-1 font-medium text-m3-primary">
            <Command className="h-3 w-3" aria-hidden="true" />
            {t("palette.title")}
          </span>
        </footer>
      </section>
    </div>
  );
}

export function CommandPaletteTrigger({
  language,
  className,
}: {
  language?: Language;
  className?: string;
}) {
  const { togglePalette } = useCommandPalette();
  const t = sharedUiT(language);
  return (
    <button
      type="button"
      onClick={togglePalette}
      aria-label={t("suite.commandPalette.open")}
      title={t("suite.commandPalette.open")}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xl border border-m3-border bg-m3-card px-3 py-2 text-xs font-medium text-m3-secondary shadow-xs transition-[background-color,color,transform] duration-150 hover:bg-m3-hover hover:text-m3-text active:scale-[.98]",
        className,
      )}
    >
      <Search className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden font-semibold sm:inline">{t("suite.commandPalette.search")}</span>
      <kbd className="rounded-md border border-m3-border bg-m3-bg px-1.5 py-0.5 text-[10px] font-mono font-bold text-m3-secondary">
        ⌘K
      </kbd>
    </button>
  );
}
