/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AiOpenAppDetail = {
  app: string;
  path: string;
  openIn: "same" | "new";
  reason?: string;
};

export const AI_OPEN_APP_EVENT = "hosanna:ai-open-app";

export function dispatchAiOpenApp(detail: AiOpenAppDetail) {
  window.dispatchEvent(new CustomEvent(AI_OPEN_APP_EVENT, { detail }));
}

/**
 * Resolve a Hosanna app id to an origin.
 * - `saas` → apex (`https://hosanna.live`)
 * - anything else → `https://{dev-}{app}.hosanna.live`
 *
 * Pass `overrides` for local/dev env URLs (studio, auth, saas, …).
 */
export function resolveHosannaAppOrigin(
  app: string,
  opts?: {
    currentHost?: string;
    overrides?: Partial<Record<string, string>>;
  },
): string {
  const id = app.trim().toLowerCase() || "saas";
  const override = opts?.overrides?.[id]?.replace(/\/+$/, "");
  if (override) return override;

  const host = opts?.currentHost ?? (typeof window !== "undefined" ? window.location.hostname : "");
  const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  const isDevHosanna =
    !isLocal && (host.startsWith("dev-") || host.includes(".dev-") || host.startsWith("dev."));

  if (id === "saas" || id === "www") {
    return "https://hosanna.live";
  }

  if (isLocal) {
    // Sensible localhost defaults when env overrides are missing.
    if (id === "studio") return "http://localhost:5173";
    if (id === "auth") return "http://localhost:5174";
    if (id === "api") return "http://localhost:3000";
  }

  const prefix = isDevHosanna ? "dev-" : "";
  return `https://${prefix}${id}.hosanna.live`;
}

function normalizePath(path: string): string {
  const trimmed = (path || "/").trim() || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

const warmedOrigins = new Set<string>();

/**
 * Warm TLS to a Hosanna app origin (same idea as Studio ↔ Auth handoff).
 * Safe to call repeatedly; each origin is only linked once.
 */
export function warmHosannaAppOrigin(origin: string): void {
  if (typeof document === "undefined") return;
  const normalized = origin.replace(/\/+$/, "");
  if (!normalized || warmedOrigins.has(normalized)) return;
  try {
    const parsed = new URL(normalized);
    if (parsed.origin === window.location.origin) return;
  } catch {
    return;
  }
  warmedOrigins.add(normalized);

  const ensureLink = (rel: string, href: string) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (rel === "preconnect") link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  };

  ensureLink("dns-prefetch", normalized);
  ensureLink("preconnect", normalized);
}

export type OpenAppNavigateContext = {
  app: string;
  origin: string;
  path: string;
  url: string;
};

export type PerformOpenAppOptions = {
  resolveOrigin?: (app: string) => string;
  /** Prefer SPA navigation when the target is already this origin. */
  navigateSameOrigin?: (path: string) => void;
  /**
   * Cross-origin same-tab prep (theme cookie, returnUrl, …).
   * Return a URL to override the default `{origin}{path}`.
   * When this returns, `performOpenApp` still warms the origin then assigns.
   */
  prepareCrossOriginNavigate?: (ctx: OpenAppNavigateContext) => string | void;
};

/** Execute an open_app directive in the browser. */
export function performOpenApp(detail: AiOpenAppDetail, opts?: PerformOpenAppOptions) {
  const resolve = opts?.resolveOrigin ?? ((app: string) => resolveHosannaAppOrigin(app));
  const app = detail.app.trim().toLowerCase() || "saas";
  const origin = resolve(app).replace(/\/+$/, "");
  const path = normalizePath(detail.path);
  let url = `${origin}${path}`;

  if (detail.openIn === "new") {
    warmHosannaAppOrigin(origin);
    window.open(url, "_blank", "noopener,noreferrer");
    return { url, mode: "new" as const };
  }

  const sameOrigin = window.location.origin === origin;
  if (sameOrigin && opts?.navigateSameOrigin) {
    opts.navigateSameOrigin(path);
    return { url, mode: "spa" as const };
  }

  // Match Studio ↔ Auth: warm TLS, let the host sync theme / returnUrl, then assign.
  warmHosannaAppOrigin(origin);
  const prepared = opts?.prepareCrossOriginNavigate?.({ app, origin, path, url });
  if (typeof prepared === "string" && prepared.trim()) {
    url = prepared.trim();
  }
  window.location.assign(url);
  return { url, mode: "assign" as const };
}
