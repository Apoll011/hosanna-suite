/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

export interface PreviewSettings {
  showChords: boolean;
  transposeVal: number;
  capoVal: number;
  fontSize: number;
  instrument: string;
  showDiagrams: boolean;
  showYoutubePlayer: boolean;
}

export interface SongPitchOverlay {
  transposeVal: number;
  capoVal: number;
}

const DEFAULT_SETTINGS: PreviewSettings = {
  showChords: true,
  transposeVal: 0,
  capoVal: 0,
  fontSize: 16,
  instrument: "guitar",
  showDiagrams: true,
  showYoutubePlayer: false,
};

const STORAGE_KEY = "chordpro-preview-settings";
const OVERLAYS_STORAGE_KEY = "chordpro-preview-overlays";

export function loadAllSongPitchOverlays(): Record<string, SongPitchOverlay> {
  try {
    const raw = localStorage.getItem(OVERLAYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadSongPitchOverlay(songId: string): SongPitchOverlay | null {
  const all = loadAllSongPitchOverlays();
  return all[songId] ?? null;
}

export function saveSongPitchOverlay(songId: string, overlay: SongPitchOverlay): void {
  try {
    const all = loadAllSongPitchOverlays();
    all[songId] = overlay;
    localStorage.setItem(OVERLAYS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function clearSongPitchOverlay(songId: string): void {
  try {
    const all = loadAllSongPitchOverlays();
    delete all[songId];
    localStorage.setItem(OVERLAYS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function loadSettings(): PreviewSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let state: PreviewSettings = loadSettings();
const listeners = new Set<() => void>();

function setState(updater: (prev: PreviewSettings) => PreviewSettings) {
  state = updater(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — silently ignore
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = { ...DEFAULT_SETTINGS, ...JSON.parse(e.newValue) };
        listeners.forEach((l) => l());
      } catch {}
    }
  });
}

export function usePreviewSettings(
  songId?: string | null,
  directiveDefaults?: { transposeVal: number; capoVal: number },
) {
  const settings = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (!songId) return;
    const overlay = loadSongPitchOverlay(songId);
    if (overlay) {
      setState((prev) => ({
        ...prev,
        transposeVal: overlay.transposeVal,
        capoVal: overlay.capoVal,
      }));
    } else if (directiveDefaults) {
      setState((prev) => ({
        ...prev,
        transposeVal: directiveDefaults.transposeVal,
        capoVal: directiveDefaults.capoVal,
      }));
    }
  }, [songId, directiveDefaults?.transposeVal, directiveDefaults?.capoVal]);

  const updateSetting = useCallback(
    <K extends keyof PreviewSettings>(key: K, value: PreviewSettings[K]) => {
      setState((prev) => {
        const next = { ...prev, [key]: value };
        if (songId && (key === "transposeVal" || key === "capoVal")) {
          saveSongPitchOverlay(songId, {
            transposeVal: next.transposeVal,
            capoVal: next.capoVal,
          });
        }
        return next;
      });
    },
    [songId],
  );

  const resetSettings = useCallback(() => {
    if (songId) {
      clearSongPitchOverlay(songId);
      setState((prev) => ({
        ...DEFAULT_SETTINGS,
        fontSize: prev.fontSize,
        instrument: prev.instrument,
        showDiagrams: prev.showDiagrams,
        showChords: prev.showChords,
        transposeVal: directiveDefaults?.transposeVal ?? 0,
        capoVal: directiveDefaults?.capoVal ?? 0,
      }));
    } else {
      setState(() => DEFAULT_SETTINGS);
    }
  }, [songId, directiveDefaults?.transposeVal, directiveDefaults?.capoVal]);

  return { settings, updateSetting, resetSettings };
}
