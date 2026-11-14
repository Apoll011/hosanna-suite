/** Base URLs for each app under test. Override via env in CI or local. */

export const SAAS_URL = process.env.PLAYWRIGHT_SAAS_URL ?? "http://127.0.0.1:8080";
export const AUTH_URL = process.env.PLAYWRIGHT_AUTH_URL ?? "http://127.0.0.1:5174";
export const STUDIO_URL = process.env.PLAYWRIGHT_STUDIO_URL ?? "http://127.0.0.1:5173";

export const DEMO_ORG_SLUG = "hosanna-demo";

/** Auth app may be local (Playwright webServer) or production fallback from studio env. */
export function isAuthAppUrl(url: URL): boolean {
  const expected = new URL(AUTH_URL);
  if (url.origin === expected.origin) return true;
  return url.hostname === "auth.hosanna.live";
}

export function isStudioUrl(url: URL): boolean {
  return url.origin === new URL(STUDIO_URL).origin;
}
