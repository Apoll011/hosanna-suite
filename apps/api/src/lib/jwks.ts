// SPDX-License-Identifier: AGPL-3.0-only
import { createScopedCache, globalCacheKey } from "@hosanna/cache";
import { createLocalJWKSet, type JSONWebKeySet, type JWTVerifyGetKey } from "jose";
import { auth } from "./auth.js";

/** JWKS rarely rotates — cache in memory/Redis to skip DB on every MCP JWT. */
const JWKS_TTL_MS = 10 * 60_000;
const jwksCache = createScopedCache({ namespace: "auth:jwks", ttlMs: JWKS_TTL_MS });
const JWKS_DOC_KEY = globalCacheKey("document");

let localKeySet: JWTVerifyGetKey | null = null;
let localKeySetAt = 0;

async function loadJwksDocument(): Promise<JSONWebKeySet> {
  const cached = await jwksCache.get<JSONWebKeySet>(JWKS_DOC_KEY);
  if (cached?.keys?.length) return cached;

  const document = (await auth.api.getJwks()) as JSONWebKeySet;
  if (!document?.keys?.length) {
    throw new Error("Better Auth JWKS returned no keys");
  }
  await jwksCache.set(JWKS_DOC_KEY, document);
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
