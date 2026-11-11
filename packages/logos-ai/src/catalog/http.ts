/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HTTP catalog for thin hosts (auth, future apps). One factory — no per-app
 * song/service API modules.
 */

import { createCatalog } from "./create";
import type {
  CatalogService,
  CatalogServiceElement,
  CatalogSong,
  LogosCatalog,
} from "./types";

export type CatalogRequest = <T>(
  path: string,
  init?: {
    method?: string;
    body?: string;
    organizationId?: string | null;
  },
) => Promise<T>;

export type CreateHttpCatalogOptions = {
  request: CatalogRequest;
  organizationId: string | null | undefined;
  canUpdate?: { song?: boolean; service?: boolean };
};

function notFoundToNull<T>(err: unknown): T | null {
  const message = err instanceof Error ? err.message : "";
  if (/404|not found/i.test(message)) return null;
  throw err;
}

/** Org-scoped REST catalog used by Auth and any future thin Logos host. */
export function createHttpCatalog(opts: CreateHttpCatalogOptions): LogosCatalog {
  const { request, organizationId, canUpdate } = opts;
  const org = () => {
    if (!organizationId) throw new Error("No organization");
    return organizationId;
  };

  return createCatalog({
    canUpdate: {
      song: canUpdate?.song ?? false,
      service: canUpdate?.service ?? false,
    },
    handlers: {
      song: {
        get: async (id) => {
          if (!organizationId) return null;
          try {
            return await request<CatalogSong>(`/songs/${encodeURIComponent(id)}`, {
              organizationId,
            });
          } catch (err) {
            return notFoundToNull<CatalogSong>(err);
          }
        },
        update: async (id, patch) => {
          const updatedAt = patch.updatedAt;
          if (!updatedAt) throw new Error("updatedAt required");
          await request<CatalogSong>(`/songs/${encodeURIComponent(id)}`, {
            method: "PUT",
            organizationId: org(),
            body: JSON.stringify({
              updatedAt,
              ...(patch.title !== undefined ? { title: patch.title } : {}),
              ...(patch.artist !== undefined ? { artist: patch.artist } : {}),
              ...(patch.content !== undefined ? { content: patch.content } : {}),
              ...(patch.song_number !== undefined ? { song_number: patch.song_number } : {}),
            }),
          });
        },
      },
      service: {
        get: async (id) => {
          if (!organizationId) return null;
          try {
            const raw = await request<CatalogService & { elements?: CatalogServiceElement[] }>(
              `/services/${encodeURIComponent(id)}`,
              { organizationId },
            );
            return { ...raw, elements: raw.elements ?? [] };
          } catch (err) {
            return notFoundToNull<CatalogService>(err);
          }
        },
        update: async (id, patch) => {
          const updatedAt = patch.updatedAt;
          if (!updatedAt) throw new Error("updatedAt required");
          const organizationId = org();
          if (patch.elements) {
            const updated = await request<CatalogService>(
              `/services/${encodeURIComponent(id)}/elements`,
              {
                method: "PUT",
                organizationId,
                body: JSON.stringify({ updatedAt, elements: patch.elements }),
              },
            );
            if (patch.name !== undefined || patch.notes !== undefined) {
              await request(`/services/${encodeURIComponent(id)}`, {
                method: "PUT",
                organizationId,
                body: JSON.stringify({
                  updatedAt: updated.updatedAt,
                  ...(patch.name !== undefined ? { name: patch.name } : {}),
                  ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
                }),
              });
            }
            return;
          }
          await request(`/services/${encodeURIComponent(id)}`, {
            method: "PUT",
            organizationId,
            body: JSON.stringify({
              updatedAt,
              ...(patch.name !== undefined ? { name: patch.name } : {}),
              ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
            }),
          });
        },
      },
    },
  });
}
