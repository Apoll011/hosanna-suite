import type { Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * RFC 9728 Protected Resource Metadata for the MCP resource server.
 * ChatGPT / MCP clients discover the authorization server from the MCP host
 * (API), even though OAuth endpoints live on the auth app.
 */
export function buildOauthProtectedResourceMetadata() {
  const issuer = new URL("/api/auth", env.authUrl).toString().replace(/\/$/, "");
  return {
    resource: env.mcpResourceUrl,
    authorization_servers: [issuer],
    bearer_methods_supported: ["header"] as const,
  };
}

export function sendOauthProtectedResourceMetadata(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json(buildOauthProtectedResourceMetadata());
}

/** WWW-Authenticate challenge so clients can discover metadata from a 401. */
export function mcpWwwAuthenticateHeader(): string {
  const origin = new URL(env.mcpResourceUrl).origin;
  return `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`;
}
