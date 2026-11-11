/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Route tool-output host directives according to the mounting app's capabilities.
 *
 * Studio keeps local navigate/print/sync.
 * Thin hosts (auth, future apps) stay in chat for proposals — navigate/print are
 * NOT auto-executed (ToolGroup shows an optional "Open in Music" card instead).
 * Explicit `open_app` still runs immediately.
 */

import type { LogosHost } from "../../host/types";
import { hasCapability } from "../../host/capabilities";
import {
  dispatchAiNavigate,
  dispatchAiPrint,
  type AiNavigateDetail,
  type AiPrintDetail,
} from "./contextBridge";
import { dispatchAiOpenApp, type AiOpenAppDetail } from "./openApp";

function asRecord(output: unknown): Record<string, unknown> | null {
  if (output == null) return null;
  if (typeof output === "object" && !Array.isArray(output)) {
    return output as Record<string, unknown>;
  }
  if (typeof output === "string") {
    try {
      const parsed = JSON.parse(output) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function parseToolJson(output: unknown): Record<string, unknown> | null {
  const direct = asRecord(output);
  if (direct) {
    if (
      direct.studioNavigate === true ||
      direct.studioPrint === true ||
      direct.openApp === true ||
      direct.studioSync === true ||
      direct.hostNavigate === true ||
      direct.hostPrint === true
    ) {
      return direct;
    }
    if (typeof direct.text === "string") return parseToolJson(direct.text);
    if (Array.isArray(direct.content)) {
      const text = (direct.content as Array<{ type?: string; text?: string }>)
        .map((c) => (c?.type === "text" ? (c.text ?? "") : ""))
        .join("");
      return text ? parseToolJson(text) : null;
    }
  }
  return direct;
}

function routeNavigate(body: Record<string, unknown>, host: LogosHost) {
  if (!hasCapability(host.profile, "navigate.local")) {
    // Thin host: stay in chat. AiHostActionCard offers a manual open.
    return;
  }
  const detail: AiNavigateDetail = {
    kind: String(body.kind),
    id: typeof body.id === "string" ? body.id : ((body.id as null) ?? null),
    route: typeof body.route === "string" ? body.route : undefined,
    reason: typeof body.reason === "string" ? body.reason : undefined,
  };
  dispatchAiNavigate(detail);
}

function routePrint(body: Record<string, unknown>, host: LogosHost) {
  if (!hasCapability(host.profile, "print")) {
    // Thin host: stay in chat. AiHostActionCard offers a manual open/print.
    return;
  }
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === "string")
    : [];
  if (!ids.length || typeof body.kind !== "string") return;

  const detail: AiPrintDetail = {
    kind: body.kind,
    ids,
    title: typeof body.title === "string" ? body.title : undefined,
    options:
      body.options && typeof body.options === "object"
        ? (body.options as Record<string, unknown>)
        : undefined,
    reason: typeof body.reason === "string" ? body.reason : undefined,
  };
  dispatchAiPrint(detail);
}

/**
 * Dispatch navigate / print / open_app / sync from tool output.
 * Pass the current LogosHost so actions respect capabilities.
 */
export function maybeDispatchHostActions(
  _toolName: string,
  output: unknown,
  host?: LogosHost | null,
) {
  const body = parseToolJson(output);
  if (!body) return;

  const profile = host?.profile ?? {
    appId: "unknown",
    capabilities: [],
  };

  if (
    (body.studioNavigate === true || body.hostNavigate === true) &&
    typeof body.kind === "string"
  ) {
    if (host) routeNavigate(body, host);
    else {
      dispatchAiNavigate({
        kind: body.kind,
        id: typeof body.id === "string" ? body.id : ((body.id as null) ?? null),
        route: typeof body.route === "string" ? body.route : undefined,
        reason: typeof body.reason === "string" ? body.reason : undefined,
      });
    }
  }

  if (
    (body.studioPrint === true || body.hostPrint === true) &&
    typeof body.kind === "string" &&
    Array.isArray(body.ids)
  ) {
    if (host) routePrint(body, host);
    else {
      const ids = body.ids.filter((id): id is string => typeof id === "string");
      if (ids.length) {
        dispatchAiPrint({
          kind: body.kind,
          ids,
          title: typeof body.title === "string" ? body.title : undefined,
          options:
            body.options && typeof body.options === "object"
              ? (body.options as Record<string, unknown>)
              : undefined,
          reason: typeof body.reason === "string" ? body.reason : undefined,
        });
      }
    }
  }

  if (body.studioSync === true) {
    if (!hasCapability(profile, "library.sync")) return;
    return;
  }

  // Explicit cross-app jump — always honor (user asked to leave / open another app).
  if (body.openApp === true && typeof body.app === "string") {
    const openIn = body.openIn === "new" ? "new" : "same";
    const detail: AiOpenAppDetail = {
      app: body.app,
      path: typeof body.path === "string" ? body.path : "/",
      openIn,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    };
    dispatchAiOpenApp(detail);
  }
}
