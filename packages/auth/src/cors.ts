/**
 * Credentialed CORS for Better Auth fetch handlers.
 *
 * Express API used `cors({ credentials: true })`. The auth Next.js app has no
 * equivalent, so Studio cross-origin calls (get-session, org, etc.) fail without
 * this wrapper. Better Auth trustedOrigins only cover CSRF/origin checks — they
 * do not emit Access-Control-* response headers.
 */

type AuthFetchHandler = (request: Request) => Response | Promise<Response>;

const LOCAL_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "hosanna://localhost",
]);

const EXTRA_ORIGINS = new Set([
  "https://claude.ai",
  "https://www.claude.ai",
  "https://chatgpt.com",
  "https://chat.openai.com",
  "https://cursor.com",
]);

/** Same host policy as the API Express CORS allowlist. */
export function isTrustedCorsOrigin(origin: string): boolean {
  if (LOCAL_ORIGINS.has(origin) || EXTRA_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (host === "hosanna.live" || host.endsWith(".hosanna.live")) return true;
    if (host === "openai.com" || host.endsWith(".openai.com")) return true;
    if (host === "cursor.com" || host.endsWith(".cursor.com") || host.endsWith(".cursor.sh")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function corsHeadersFor(request: Request): Headers | null {
  const origin = request.headers.get("origin");
  if (!origin || !isTrustedCorsOrigin(origin)) return null;

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Expose-Headers", "set-auth-token");
  headers.set("Vary", "Origin");

  if (request.method === "OPTIONS") {
    headers.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    const requested = request.headers.get("access-control-request-headers");
    headers.set(
      "Access-Control-Allow-Headers",
      requested?.trim() || "content-type, authorization, x-captcha-response, x-requested-with",
    );
    headers.set("Access-Control-Max-Age", "86400");
  }

  return headers;
}

function withCorsHeaders(response: Response, cors: Headers): Response {
  const headers = new Headers(response.headers);
  cors.forEach((value, key) => {
    // Preserve an existing Vary that already includes other fields.
    if (key.toLowerCase() === "vary") {
      const existing = headers.get("Vary");
      if (existing) {
        const parts = new Set(
          existing
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
        );
        value.split(",").forEach((p) => parts.add(p.trim()));
        headers.set("Vary", Array.from(parts).join(", "));
        return;
      }
    }
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Wrap a Fetch-style Better Auth handler with credentialed CORS + OPTIONS.
 */
export function withAuthCors(handler: AuthFetchHandler): AuthFetchHandler {
  return async (request) => {
    const cors = corsHeadersFor(request);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors ?? undefined,
      });
    }

    const response = await handler(request);
    if (!cors) return response;
    return withCorsHeaders(response, cors);
  };
}
