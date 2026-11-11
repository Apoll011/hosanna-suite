/**
 * Thin service catalog client for Logos AI on auth (and other non-Studio hosts).
 */

import { apiFetch } from "@/lib/services/api";

export type CatalogServiceElement = {
  id: string;
  type: string;
  title?: string;
  songId?: string;
  content?: string;
  position?: number;
  notes?: string;
  passage?: string;
  duration?: number;
};

export type CatalogService = {
  id: string;
  name: string;
  date?: string;
  notes?: string | null;
  elements?: CatalogServiceElement[];
  updatedAt: string;
};

type OrgScoped = { organizationId: string };

export const servicesApi = {
  getById: async (
    id: string,
    { organizationId }: OrgScoped,
  ): Promise<CatalogService | null> => {
    try {
      return await apiFetch<CatalogService>(`/services/${encodeURIComponent(id)}`, {
        organizationId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/404|not found/i.test(message)) return null;
      throw err;
    }
  },

  update: (
    id: string,
    data: {
      updatedAt: string;
      name?: string;
      notes?: string | null;
      elements?: CatalogServiceElement[];
    },
    { organizationId }: OrgScoped,
  ): Promise<CatalogService> =>
    apiFetch<CatalogService>(`/services/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
      organizationId,
    }),

  updateElements: (
    id: string,
    data: { updatedAt: string; elements: CatalogServiceElement[] },
    { organizationId }: OrgScoped,
  ): Promise<CatalogService> =>
    apiFetch<CatalogService>(`/services/${encodeURIComponent(id)}/elements`, {
      method: "PUT",
      body: JSON.stringify(data),
      organizationId,
    }),
};
