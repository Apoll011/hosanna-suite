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
    return override.startsWith("http")
      ? override
      : `${window.location.origin}${override}`;
  }
  const explicit = searchParams ? readRedirectParam(searchParams) : null;
  if (explicit) {
    return explicit.startsWith("http")
      ? explicit
      : `${window.location.origin}${explicit}`;
  }
  const storedSlug = localStorage.getItem("active_org_slug");
  if (storedSlug) {
    return `${getStudioUrl()}/${storedSlug}`;
  }
  return `${window.location.origin}/onboarding`;
}
