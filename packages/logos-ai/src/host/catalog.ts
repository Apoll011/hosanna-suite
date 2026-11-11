/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Catalog access for proposals — prefers the host React adapter (Studio cache),
 * then falls back to LogosApi.getSong / updateSong so auth and future apps work
 * without embedding a song editor.
 */

import { useCallback, useEffect, useState } from "react";
import { hasCapability } from "./capabilities";
import { useLogosHost } from "./context";
import { useHostSong, useHostUpdateSong, useLogosSongAdapter } from "./songAdapter";
import type { LogosService, LogosSong } from "./types";

export type CatalogSongState = {
  data: LogosSong | null | undefined;
  isLoading: boolean;
  /** Finished loading and no song found (local or API). */
  notFound: boolean;
  /** Song came from LogosApi.getSong rather than the host adapter. */
  fromApi: boolean;
};

/** Load a song for proposal diffs — adapter first, API catalog second. */
export function useCatalogSong(id: string | null | undefined): CatalogSongState {
  const { api } = useLogosHost();
  // Ensure adapter is present (throws if missing — same as useHostSong).
  useLogosSongAdapter();
  const local = useHostSong(id);
  const [remote, setRemote] = useState<LogosSong | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteTried, setRemoteTried] = useState(false);

  useEffect(() => {
    setRemote(null);
    setRemoteTried(false);
    setRemoteLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (local.data) {
      setRemote(null);
      setRemoteTried(true);
      return;
    }
    if (local.isLoading) return;
    if (!api.getSong) {
      setRemoteTried(true);
      return;
    }

    let cancelled = false;
    setRemoteLoading(true);
    void api
      .getSong(id)
      .then((song) => {
        if (!cancelled) setRemote(song);
      })
      .catch(() => {
        if (!cancelled) setRemote(null);
      })
      .finally(() => {
        if (!cancelled) {
          setRemoteLoading(false);
          setRemoteTried(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, local.data, local.isLoading, api]);

  const data = local.data ?? remote ?? undefined;
  const isLoading = Boolean(id) && (local.isLoading || remoteLoading || (!remoteTried && !local.data));
  const notFound = Boolean(id) && !isLoading && !data;

  return {
    data,
    isLoading,
    notFound,
    fromApi: !local.data && Boolean(remote),
  };
}

/**
 * Persist a song proposal.
 * Prefer the host adapter when the app has a real library cache (Studio).
 * Fall back to LogosApi.updateSong for thin hosts (auth, future apps).
 * Ensures `updatedAt` for API concurrency when the caller omitted it.
 */
export function useCatalogUpdateSong() {
  const { api, profile } = useLogosHost();
  const adapterUpdate = useHostUpdateSong();
  const preferAdapter = hasCapability(profile, "editor.songs");

  return useCallback(
    async (args: { id: string; data: Partial<LogosSong> }) => {
      if (preferAdapter) {
        await adapterUpdate(args);
        return;
      }
      if (api.updateSong) {
        let patch = args.data;
        if (!patch.updatedAt && api.getSong) {
          const current = await api.getSong(args.id);
          if (!current?.updatedAt) {
            throw new Error("Song not found or missing updatedAt");
          }
          patch = { ...patch, updatedAt: current.updatedAt };
        }
        await api.updateSong(args.id, patch);
        return;
      }
      await adapterUpdate(args);
    },
    [api, adapterUpdate, preferAdapter],
  );
}

export type CatalogServiceState = {
  data: LogosService | null | undefined;
  isLoading: boolean;
  notFound: boolean;
};

/** Load a service for proposal cards (API catalog — works on any host). */
export function useCatalogService(id: string | null | undefined): CatalogServiceState {
  const { api } = useLogosHost();
  const [data, setData] = useState<LogosService | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setData(undefined);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setData(undefined);
      setIsLoading(false);
      return;
    }
    if (!api.getService) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void api
      .getService(id)
      .then((service) => {
        if (!cancelled) setData(service);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, api]);

  const notFound = Boolean(id) && !isLoading && !data;

  return { data, isLoading, notFound };
}

/** Persist a service proposal via LogosApi (chat Accept on thin hosts / any app). */
export function useCatalogUpdateService() {
  const { api } = useLogosHost();

  return useCallback(
    async (args: {
      id: string;
      data: Partial<Pick<LogosService, "name" | "notes" | "elements" | "updatedAt">>;
    }) => {
      if (!api.updateService) throw new Error("Service updates are not available here");
      let patch = args.data;
      if (!patch.updatedAt && api.getService) {
        const current = await api.getService(args.id);
        if (!current?.updatedAt) throw new Error("Service not found or missing updatedAt");
        patch = { ...patch, updatedAt: current.updatedAt };
      }
      await api.updateService(args.id, patch);
    },
    [api],
  );
}
