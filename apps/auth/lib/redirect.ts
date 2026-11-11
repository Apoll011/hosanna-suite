import { authClient } from "@/lib/auth-client";

/** Studio origin for post-login redirects. */
export function getStudioUrl(): string {
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_STUDIO_URL) ||
    "https://studio.hosanna.live"
  ).replace(/\/+$/, "");
}

/** Absolute http(s) URLs or same-origin relative paths (not protocol-relative). */
export function isSafeRedirectTarget(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function readRedirectParam(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): string | null {
  const raw = searchParams.get("redirect") || searchParams.get("returnUrl");
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  return isSafeRedirectTarget(decoded) ? decoded : null;
}

export function navigateToRedirectTarget(target: string): void {
  if (target.startsWith("http://") || target.startsWith("https://")) {
    window.location.assign(target);
    return;
  }
  window.location.assign(target);
}

/**
 * After the user gains an org (create / accept invite): honor returnUrl/redirect
 * when present, upgrading Studio root → `/{slug}`; otherwise open Studio on the org.
 */
export function resolvePostOrgDestination(
  slug: string,
  searchParams?: URLSearchParams | { get: (key: string) => string | null } | null,
): string {
  const studio = getStudioUrl();
  const fallback = `${studio}/${slug}`;
  const explicit = searchParams ? readRedirectParam(searchParams) : null;
  if (!explicit) return fallback;

  try {
    const studioOrigin = new URL(studio).origin;
    const url = new URL(explicit, typeof window !== "undefined" ? window.location.origin : studio);
    if (url.origin === studioOrigin) {
      const path = url.pathname.replace(/\/+$/, "") || "/";
      if (path === "/") {
        return `${studio}/${slug}${url.search}${url.hash}`;
      }
    }
    return explicit.startsWith("http://") || explicit.startsWith("https://")
      ? explicit
      : url.pathname + url.search + url.hash;
  } catch {
    return explicit;
  }
}

export function navigateAfterOrgReady(
  slug: string,
  searchParams?: URLSearchParams | { get: (key: string) => string | null } | null,
): void {
  if (slug) localStorage.setItem("active_org_slug", slug);
  navigateToRedirectTarget(resolvePostOrgDestination(slug, searchParams));
}

/**
 * After successful auth: honor redirect/returnUrl, else org → Studio, else onboarding.
 */
export async function redirectAfterSuccessfulAuth(
  searchParams?: URLSearchParams | { get: (key: string) => string | null },
): Promise<void> {
  const explicit = searchParams ? readRedirectParam(searchParams) : null;
  if (explicit) {
    navigateToRedirectTarget(explicit);
    return;
  }

  try {
    const { data: orgs } = await authClient.organization.list({});
    const list = (orgs as Array<{ slug?: string }> | null) ?? [];
    const storedSlug =
      typeof localStorage !== "undefined" ? localStorage.getItem("active_org_slug") : null;
    const slug =
      (storedSlug && list.some((o) => o.slug === storedSlug) ? storedSlug : null) ||
      list.find((o) => o.slug)?.slug;

    if (slug) {
      localStorage.setItem("active_org_slug", slug);
      try {
        await authClient.organization.setActive({ organizationSlug: slug });
      } catch {
        /* studio still opens with the slug even if setActive fails */
      }
      window.location.assign(`${getStudioUrl()}/${slug}`);
      return;
    }
  } catch {
    // fall through to onboarding
  }

  window.location.assign("/onboarding");
}

/** Social OAuth callback URL after provider round-trip. */
export function resolveSocialCallbackURL(
  searchParams?: URLSearchParams | { get: (key: string) => string | null },
  override?: string,
): string {
  if (override && isSafeRedirectTarget(override)) {
    return override.startsWith("http") ? override : `${window.location.origin}${override}`;
  }
  const explicit = searchParams ? readRedirectParam(searchParams) : null;
  if (explicit) {
    return explicit.startsWith("http") ? explicit : `${window.location.origin}${explicit}`;
  }
  const storedSlug = localStorage.getItem("active_org_slug");
  if (storedSlug) {
    return `${getStudioUrl()}/${storedSlug}`;
  }
  return `${window.location.origin}/onboarding`;
}
