/**
 * Thin song catalog client for Logos AI on auth (and any non-Studio host).
 * Uses the shared org-scoped API — no local library cache.
 */

import { apiFetch } from "@/lib/services/api";

export type CatalogSong = {
  id: string;
  title: string;
  artist?: string | null;
  content: string;
  song_number?: number | null;
  updatedAt: string;
};

type OrgScoped = { organizationId: string };

export const songsApi = {
  getById: async (
    id: string,
    { organizationId }: OrgScoped,
  ): Promise<CatalogSong | null> => {
    try {
      return await apiFetch<CatalogSong>(`/songs/${encodeURIComponent(id)}`, {
        organizationId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // 404 → null so proposal UI can show "song gone" instead of a hard error.
      if (/404|not found/i.test(message)) return null;
      throw err;
    }
  },

  update: (
    id: string,
    data: {
      updatedAt: string;
      title?: string;
      artist?: string;
      content?: string;
      song_number?: number | null;
    },
    { organizationId }: OrgScoped,
  ): Promise<CatalogSong> =>
    apiFetch<CatalogSong>(`/songs/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
      organizationId,
    }),
};
