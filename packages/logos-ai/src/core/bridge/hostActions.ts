/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Route tool-output host directives according to the mounting app's capabilities.
 * Studio keeps local navigate/print/sync; other hosts fall back to `open_app`.
 */

import type { LogosHost } from "../../host/types";
import {
  hasCapability,
  musicAppId,
  planningAppId,
  type LogosHostProfile,
} from "../../host/capabilities";
import {
  dispatchAiNavigate,
  dispatchAiPrint,
  type AiNavigateDetail,
  type AiPrintDetail,
} from "./contextBridge";
import { dispatchAiOpenApp, type AiOpenAppDetail } from "./openApp";
import { studioPathForNavigate, studioPathForPrint } from "./studioPaths";

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

function openMusic(path: string, reason: string | undefined, profile: LogosHostProfile) {
  const detail: AiOpenAppDetail = {
    app: musicAppId(profile),
    path,
    openIn: "same",
    reason,
  };
  dispatchAiOpenApp(detail);
}

function openPlanning(path: string, reason: string | undefined, profile: LogosHostProfile) {
  const detail: AiOpenAppDetail = {
    app: planningAppId(profile),
    path,
    openIn: "same",
    reason,
  };
  dispatchAiOpenApp(detail);
}

function routeNavigate(body: Record<string, unknown>, host: LogosHost) {
  const detail: AiNavigateDetail = {
    kind: String(body.kind),
    id: typeof body.id === "string" ? body.id : ((body.id as null) ?? null),
    route: typeof body.route === "string" ? body.route : undefined,
    reason: typeof body.reason === "string" ? body.reason : undefined,
  };

  if (hasCapability(host.profile, "navigate.local")) {
    dispatchAiNavigate(detail);
    return;
  }

  const path = studioPathForNavigate(detail, host.slugPrefix);
  // Services/agenda → planning owner; songs/library → music owner.
  if (detail.kind === "service" || detail.kind === "services" || detail.kind === "agenda") {
    openPlanning(path, detail.reason, host.profile);
  } else {
    openMusic(path, detail.reason, host.profile);
  }
}

function routePrint(body: Record<string, unknown>, host: LogosHost) {
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

  if (hasCapability(host.profile, "print")) {
    dispatchAiPrint(detail);
    return;
  }

  // Thin hosts: open the entity in Music so the user can print there.
  openMusic(studioPathForPrint(detail, host.slugPrefix), detail.reason ?? "print", host.profile);
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
    // Only meaningful when the host can refresh its local library cache.
    if (!hasCapability(profile, "library.sync")) return;
    // Studio listens via library change / its own sync tool handler.
    return;
  }

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
