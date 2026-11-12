/**
 * Firebase Cloud Messaging (HTTP v1) client.
 * Never throws from sendFcmToToken — failures are returned for pruning.
 */

import jwt from "jsonwebtoken";
import type { FcmConfig, FcmMessage, FcmSendResult } from "../types.js";

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const FCM_SEND_ENDPOINT = (projectId: string) =>
  `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
const REQUEST_TIMEOUT_MS = 15_000;

function normalizePrivateKey(privateKey: string): string {
  return privateKey.includes("\\n") ? privateKey.replace(/\\n/g, "\n") : privateKey;
}

export function createFcmClient(config: FcmConfig) {
  let cachedAccessToken: string | null = null;
  let cachedTokenExpiresAt = 0;
  let tokenRefresh: Promise<string> | null = null;

  async function fetchAccessToken(): Promise<string> {
    const { clientEmail, privateKey } = config;
    if (!clientEmail || !privateKey) {
      throw new Error("[fcm] FCM_CLIENT_EMAIL / FCM_PRIVATE_KEY are not configured.");
    }

    const assertion = jwt.sign(
      { iss: clientEmail, scope: FCM_SCOPE },
      normalizePrivateKey(privateKey),
      {
        algorithm: "RS256",
        expiresIn: "1h",
        audience: TOKEN_ENDPOINT,
      },
    );

    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`[fcm] Failed to exchange JWT for access token (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedAccessToken = data.access_token;
    cachedTokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
    return cachedAccessToken;
  }

  async function getAccessToken(): Promise<string> {
    if (cachedAccessToken && Date.now() < cachedTokenExpiresAt - 60_000) {
      return cachedAccessToken;
    }
    if (!tokenRefresh) {
      tokenRefresh = fetchAccessToken().finally(() => {
        tokenRefresh = null;
      });
    }
    return tokenRefresh;
  }

  async function sendFcmToToken(token: string, message: FcmMessage): Promise<FcmSendResult> {
    try {
      const projectId = config.projectId;
      if (!projectId) {
        return { ok: false, invalidToken: false, error: "FCM not configured." };
      }

      const accessToken = await getAccessToken();
      const res = await fetch(FCM_SEND_ENDPOINT(projectId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          message: {
            token,
            notification: { title: message.title, body: message.body },
            ...(message.data ? { data: message.data } : {}),
            android: { priority: "HIGH" },
            apns: { payload: { aps: { sound: "default" } } },
          },
        }),
      });

      if (res.ok) return { ok: true, invalidToken: false };

      const body = await res.text().catch(() => "");
      const invalidToken =
        res.status === 404 ||
        res.status === 410 ||
        body.includes("UNREGISTERED") ||
        (res.status === 400 && /registration token|registration_token/i.test(body));

      console.error(`[fcm] Send failed (${res.status}) for token …${token.slice(-8)}: ${body}`);
      return { ok: false, invalidToken, error: body };
    } catch (err) {
      console.error("[fcm] Send failed:", err);
      return {
        ok: false,
        invalidToken: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { sendFcmToToken };
}

export type FcmClient = ReturnType<typeof createFcmClient>;
