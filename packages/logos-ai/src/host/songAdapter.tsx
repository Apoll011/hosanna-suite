/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { createContext, useContext } from "react";
import type { LogosSongAdapter } from "./types";

const LogosSongAdapterCtx = createContext<LogosSongAdapter | null>(null);

export function LogosSongAdapterProvider({
  value,
  children,
}: {
  value: LogosSongAdapter;
  children: React.ReactNode;
}) {
  return <LogosSongAdapterCtx.Provider value={value}>{children}</LogosSongAdapterCtx.Provider>;
}

export function useLogosSongAdapter(): LogosSongAdapter {
  const adapter = useContext(LogosSongAdapterCtx);
  if (!adapter) {
    throw new Error("useLogosSongAdapter must be used within LogosSongAdapterProvider");
  }
  return adapter;
}

/** Load a song via the host song adapter (proposal UI). */
export function useHostSong(id: string | null | undefined) {
  return useLogosSongAdapter().useSong(id);
}

/** Persist song updates via the host song adapter. */
export function useHostUpdateSong() {
  return useLogosSongAdapter().useUpdateSong();
}
