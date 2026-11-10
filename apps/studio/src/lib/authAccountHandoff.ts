/**
 * Soft handoff from Studio → auth /account.
 * Shows a matching account shell immediately, prefetches auth, then navigates.
 */

import { authAppHref, getAuthAppUrl } from "./authUrl";

const OVERLAY_ID = "hosanna-account-handoff";
let prefetched = false;

function uiLang(): string {
  try {
    return (document.documentElement.lang || navigator.language || "en").slice(0, 2).toLowerCase();
  } catch {
    return "en";
  }
}

function accountCopy(): { title: string; subtitle: string } {
  const lang = uiLang();
  if (lang === "pt") {
    return {
      title: "Conta",
      subtitle: "Gerir o seu perfil, segurança e sessões Hosanna.",
    };
  }
  if (lang === "es") {
    return {
      title: "Cuenta",
      subtitle: "Gestiona tu perfil, seguridad y sesiones de Hosanna.",
    };
  }
  return {
    title: "Account",
    subtitle: "Manage your Hosanna profile, security, and sessions.",
  };
}

/** Warm auth origin + account document + session cookie path. */
export function prefetchAuthAccount(): void {
  if (typeof document === "undefined" || prefetched) return;
  prefetched = true;

  const accountUrl = authAppHref("/account");
  const sessionUrl = `${getAuthAppUrl()}/api/auth/get-session`;

  const ensureLink = (rel: string, href: string, as?: string) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (as) link.setAttribute("as", as);
    document.head.appendChild(link);
  };

  ensureLink("dns-prefetch", getAuthAppUrl());
  ensureLink("preconnect", getAuthAppUrl());
  ensureLink("prefetch", accountUrl, "document");

  void fetch(sessionUrl, {
    method: "GET",
    credentials: "include",
    mode: "cors",
    cache: "no-store",
  }).catch(() => {
    /* warm only */
  });

  // Best-effort document warm (opaque if CORS blocks body — still helps connection).
  void fetch(accountUrl, {
    method: "GET",
    credentials: "include",
    mode: "cors",
    cache: "force-cache",
  }).catch(() => {
    /* ignore */
  });
}

function mountHandoffOverlay(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(OVERLAY_ID)) return;

  const { title, subtitle } = accountCopy();

  const root = document.createElement("div");
  root.id = OVERLAY_ID;
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-busy", "true");
  root.style.cssText =
    "position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;" +
    "background:var(--m3-bg,#f4f6f8);color:var(--m3-text,#1a1d24);" +
    "font-family:Figtree,system-ui,-apple-system,sans-serif;";

  root.innerHTML = `
    <header style="position:sticky;top:0;z-index:1;border-bottom:1px solid color-mix(in srgb, var(--m3-border,#d0d7e0) 70%, transparent);background:color-mix(in srgb, var(--m3-card,#fff) 85%, transparent);backdrop-filter:blur(12px);">
      <div style="margin:0 auto;height:3.5rem;max-width:64rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;padding:0 1rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;border:1px solid color-mix(in srgb, var(--m3-border,#d0d7e0) 60%, transparent);background:color-mix(in srgb, var(--m3-sidebar,#eef1f4) 80%, transparent);border-radius:9999px;padding:0.375rem 0.625rem;">
          <img src="/favicon.png" alt="" width="20" height="20" style="border-radius:0.375rem;object-fit:contain;" />
          <span style="font-size:0.8125rem;font-weight:600;letter-spacing:-0.01em;">Hosanna</span>
        </div>
        <div style="width:5.5rem;height:2.25rem;border-radius:9999px;background:var(--m3-sidebar,#eef1f4);opacity:0.7;"></div>
      </div>
    </header>
    <main style="margin:0 auto;width:100%;max-width:64rem;flex:1;padding:1.5rem 1rem 2rem;">
      <div style="margin-bottom:1.5rem;">
        <div style="height:1.75rem;width:8rem;border-radius:0.5rem;background:var(--m3-sidebar,#eef1f4);margin-bottom:0.5rem;"></div>
        <div style="height:0.875rem;width:min(24rem,90%);border-radius:0.375rem;background:var(--m3-sidebar,#eef1f4);opacity:0.75;"></div>
        <p style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">${title} — ${subtitle}</p>
      </div>
      <div style="border:1px solid var(--m3-border,#d0d7e0);border-radius:1rem;background:var(--m3-card,#fff);padding:1.25rem;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="width:4rem;height:4rem;border-radius:9999px;background:linear-gradient(to top right,#0284c7,#06b6d4);opacity:0.85;"></div>
          <div style="flex:1;">
            <div style="height:1rem;width:10rem;border-radius:0.375rem;background:var(--m3-sidebar,#eef1f4);margin-bottom:0.5rem;"></div>
            <div style="height:0.75rem;width:14rem;border-radius:0.375rem;background:var(--m3-sidebar,#eef1f4);opacity:0.7;"></div>
          </div>
        </div>
      </div>
      <div style="margin-top:1.5rem;display:grid;gap:1.5rem;">
        <div style="height:8rem;border-radius:1rem;border:1px solid var(--m3-border,#d0d7e0);background:var(--m3-card,#fff);"></div>
        <div style="height:10rem;border-radius:1rem;border:1px solid var(--m3-border,#d0d7e0);background:var(--m3-card,#fff);"></div>
      </div>
    </main>
  `;

  document.body.appendChild(root);
}

/**
 * Prefetch auth account, paint a matching shell, then hard-navigate.
 * Call this instead of raw `window.location.assign` for /account.
 */
export function navigateToAuthAccount(options?: { returnUrl?: string }): void {
  const returnUrl =
    options?.returnUrl ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  const url = authAppHref("/account", { returnUrl });

  prefetchAuthAccount();
  mountHandoffOverlay();

  const go = () => {
    window.location.assign(url);
  };

  // Let the overlay paint before tearing down Studio.
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    try {
      (
        document as Document & {
          startViewTransition?: (cb: () => void) => { finished: Promise<unknown> };
        }
      ).startViewTransition?.(go);
      return;
    } catch {
      /* fall through */
    }
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(go);
  });
}
