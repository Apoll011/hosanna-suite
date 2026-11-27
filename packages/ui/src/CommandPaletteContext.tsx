"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface CommandAction {
  id: string;
  name: string;
  subtitle?: string;
  badge?: string;
  shortcut?: string[];
  keywords?: string;
  section?: string;
  icon?: ReactNode;
  parent?: string;
  perform?: () => void | Promise<void>;
  isLoading?: boolean;
}

interface CommandPaletteContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeParentId: string | null;
  setActiveParentId: (id: string | null) => void;
  registerDynamicActions: (id: string, actions: CommandAction[]) => void;
  unregisterDynamicActions: (id: string) => void;
  recordRecentAction: (id: string) => void;
  recentActionIds: string[];
  allActions: CommandAction[];
}

const Context = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({
  children,
  staticActions = [],
  storageKey = "hosanna_command_recent_ids",
}: {
  children: ReactNode;
  staticActions?: CommandAction[];
  storageKey?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [dynamicActionGroups, setDynamicActionGroups] = useState<Record<string, CommandAction[]>>(
    {},
  );
  const [recentActionIds, setRecentActionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) && parsed.every((id) => typeof id === "string") ? parsed : [];
    } catch {
      return [];
    }
  });
  const sequenceRef = useRef<{ keys: string[]; timer: ReturnType<typeof setTimeout> | null }>({
    keys: [],
    timer: null,
  });

  const openPalette = useCallback(() => {
    setIsOpen(true);
    setSearchQuery("");
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
    setActiveParentId(null);
  }, []);

  const togglePalette = useCallback(() => {
    setIsOpen((current) => {
      if (current) {
        setSearchQuery("");
        setActiveParentId(null);
        return false;
      }
      setSearchQuery("");
      return true;
    });
  }, []);

  const registerDynamicActions = useCallback((id: string, actions: CommandAction[]) => {
    setDynamicActionGroups((groups) => ({ ...groups, [id]: actions }));
  }, []);

  const unregisterDynamicActions = useCallback((id: string) => {
    setDynamicActionGroups((groups) => {
      const next = { ...groups };
      delete next[id];
      return next;
    });
  }, []);

  const recordRecentAction = useCallback(
    (id: string) => {
      setRecentActionIds((previous) => {
        const next = [id, ...previous.filter((entry) => entry !== id)].slice(0, 5);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          return next;
        }
        return next;
      });
    },
    [storageKey],
  );

  const allActions = useMemo(() => {
    const { "ai-palette": aiActions = [], ...otherGroups } = dynamicActionGroups;
    return [...aiActions, ...staticActions, ...Object.values(otherGroups).flat()];
  }, [dynamicActionGroups, staticActions]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePalette();
        return;
      }
      const activeElement = document.activeElement;
      const typing =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true";
      if (typing || isOpen) return;

      const sequence = sequenceRef.current;
      if (sequence.timer) clearTimeout(sequence.timer);
      sequence.keys.push(event.key.toLowerCase());
      sequence.timer = setTimeout(() => {
        sequence.keys = [];
        sequence.timer = null;
      }, 600);
      const matchedAction = allActions.find(
        (action) => action.shortcut?.join("").toLowerCase() === sequence.keys.join(""),
      );
      if (matchedAction?.perform) {
        event.preventDefault();
        sequence.keys = [];
        matchedAction.perform();
        recordRecentAction(matchedAction.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allActions, isOpen, recordRecentAction, togglePalette]);

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      openPalette,
      closePalette,
      togglePalette,
      searchQuery,
      setSearchQuery,
      activeParentId,
      setActiveParentId,
      registerDynamicActions,
      unregisterDynamicActions,
      recordRecentAction,
      recentActionIds,
      allActions,
    }),
    [
      activeParentId,
      allActions,
      closePalette,
      isOpen,
      openPalette,
      recentActionIds,
      recordRecentAction,
      registerDynamicActions,
      searchQuery,
      togglePalette,
      unregisterDynamicActions,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCommandPalette() {
  const value = useContext(Context);
  if (!value) throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  return value;
}
