/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Resolve Studio (Music) SPA paths from navigate/print directives so any host
 * can open the right screen via `open_app` when it lacks local navigation.
 */

import type { AiNavigateDetail, AiPrintDetail } from "./contextBridge";

function withSlug(slugPrefix: string, path: string): string {
  const sp = (slugPrefix || "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!sp) return p;
  if (p === sp || p.startsWith(`${sp}/`)) return p;
  return `${sp}${p}`;
}

/** Map a navigate directive to a Studio path under the org slug. */
export function studioPathForNavigate(detail: AiNavigateDetail, slugPrefix = ""): string {
  const id = typeof detail.id === "string" && detail.id.trim() ? detail.id.trim() : null;
  switch (detail.kind) {
    case "song":
      return withSlug(slugPrefix, id ? `/songs/${id}` : "/songs");
    case "service":
      return withSlug(slugPrefix, id ? `/services/${id}` : "/services");
    case "folder":
      return withSlug(slugPrefix, id ? `/folders/${id}` : "/folders");
    case "collection":
      return withSlug(slugPrefix, id ? `/collections/${id}` : "/collections");
    case "agenda":
      return withSlug(slugPrefix, id ? `/agenda/${id}` : "/agenda");
    case "songs":
      return withSlug(slugPrefix, "/songs");
    case "services":
      return withSlug(slugPrefix, "/services");
    case "folders":
      return withSlug(slugPrefix, "/folders");
    case "collections":
      return withSlug(slugPrefix, "/collections");
    case "trash":
      return withSlug(slugPrefix, "/trash");
    case "teams":
      return withSlug(slugPrefix, "/teams");
    case "settings":
      return withSlug(slugPrefix, "/settings");
    case "route":
      if (detail.route) {
        const path = detail.route.startsWith("/") ? detail.route : `/${detail.route}`;
        return withSlug(slugPrefix, path);
      }
      return withSlug(slugPrefix, "/");
    default:
      return withSlug(slugPrefix, "/");
  }
}

/** Best-effort Studio path for a print directive (opens the entity; print UI is Studio-local). */
export function studioPathForPrint(detail: AiPrintDetail, slugPrefix = ""): string {
  const id = detail.ids?.[0];
  switch (detail.kind) {
    case "song":
      return studioPathForNavigate({ kind: "song", id: id ?? null }, slugPrefix);
    case "service":
      return studioPathForNavigate({ kind: "service", id: id ?? null }, slugPrefix);
    case "folder":
      return studioPathForNavigate({ kind: "folder", id: id ?? null }, slugPrefix);
    case "collection":
      return studioPathForNavigate({ kind: "collection", id: id ?? null }, slugPrefix);
    case "event":
      return studioPathForNavigate({ kind: "agenda", id: id ?? null }, slugPrefix);
    default:
      return withSlug(slugPrefix, "/songs");
  }
}
