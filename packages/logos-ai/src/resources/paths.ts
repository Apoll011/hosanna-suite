/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function withSlug(slugPrefix: string, path: string): string {
  const sp = (slugPrefix || "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!sp) return p;
  if (p === sp || p.startsWith(`${sp}/`)) return p;
  return `${sp}${p}`;
}

export function songPath(id: string | null, slugPrefix = ""): string {
  return withSlug(slugPrefix, id ? `/songs/${id}` : "/songs");
}

export function servicePath(id: string | null, slugPrefix = ""): string {
  return withSlug(slugPrefix, id ? `/services/${id}` : "/services");
}

/** Map navigate kinds → library paths (Music/Planning SPA). */
export function libraryPathForNavigate(
  detail: { kind: string; id?: string | null; route?: string },
  slugPrefix = "",
): string {
  const id = typeof detail.id === "string" && detail.id.trim() ? detail.id.trim() : null;
  switch (detail.kind) {
    case "song":
      return songPath(id, slugPrefix);
    case "service":
      return servicePath(id, slugPrefix);
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

export function libraryPathForPrint(
  detail: { kind: string; ids?: string[] },
  slugPrefix = "",
): string {
  const id = detail.ids?.[0] ?? null;
  switch (detail.kind) {
    case "song":
      return songPath(id, slugPrefix);
    case "service":
      return servicePath(id, slugPrefix);
    case "folder":
      return libraryPathForNavigate({ kind: "folder", id }, slugPrefix);
    case "collection":
      return libraryPathForNavigate({ kind: "collection", id }, slugPrefix);
    case "event":
      return libraryPathForNavigate({ kind: "agenda", id }, slugPrefix);
    default:
      return withSlug(slugPrefix, "/songs");
  }
}
