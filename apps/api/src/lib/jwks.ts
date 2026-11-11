import { createCache } from "@hosanna/cache";
import { createLocalJWKSet, type JSONWebKeySet, type JWTVerifyGetKey } from "jose";
import { auth } from "./auth.js";

/** JWKS rarely rotates — cache in memory/Redis to skip DB on every MCP JWT. */
const JWKS_TTL_MS = 10 * 60_000;
const jwksCache = createCache({ namespace: "auth:jwks", ttlMs: JWKS_TTL_MS });

let localKeySet: JWTVerifyGetKey | null = null;
let localKeySetAt = 0;

async function loadJwksDocument(): Promise<JSONWebKeySet> {
  const cached = await jwksCache.get<JSONWebKeySet>("document");
  if (cached?.keys?.length) return cached;

  const document = (await auth.api.getJwks()) as JSONWebKeySet;
  if (!document?.keys?.length) {
    throw new Error("Better Auth JWKS returned no keys");
  }
  await jwksCache.set("document", document);
  return document;
}

/** Local JWKS verifier — shared DB keys, no HTTP hop to the auth app. */
export async function getMcpJwks(): Promise<JWTVerifyGetKey> {
  const now = Date.now();
  if (localKeySet && now - localKeySetAt < JWKS_TTL_MS) {
    return localKeySet;
  }
  const document = await loadJwksDocument();
  localKeySet = createLocalJWKSet(document);
  localKeySetAt = now;
  return localKeySet;
}
