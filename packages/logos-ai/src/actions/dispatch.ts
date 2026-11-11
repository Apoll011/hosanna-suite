/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Execute actions against the current host.
 * Thin hosts: propose/confirm stay in chat; navigate/print are NO-OPs here
 * (UI shows optional open cards). Explicit openApp always runs.
 */

import {
  dispatchAiNavigate,
  dispatchAiOpenApp,
  dispatchAiPrint,
} from "../core/bridge";
import { hasCapability, musicAppId, planningAppId } from "../kernel/capabilities";
import type { LogosHost } from "../kernel/host";
import { libraryPathForNavigate, libraryPathForPrint } from "../resources/paths";
import { aiProposals } from "../proposals/store";
import type { LogosAction, LogosNavigateAction, LogosPrintAction } from "./types";

function runNavigateLocal(nav: LogosNavigateAction) {
  dispatchAiNavigate({
    kind: nav.kind,
    id: nav.id ?? null,
    route: nav.route,
    reason: nav.reason,
  });
}

function runPrintLocal(print: LogosPrintAction) {
  dispatchAiPrint({
    kind: print.kind,
    ids: print.ids,
    title: print.title,
    options: print.options,
    reason: print.reason,
  });
}

/** User-clicked deferred navigate/print from a thin-host chat card. */
export function runDeferredOffer(
  offer: { type: "navigate"; navigate: LogosNavigateAction } | { type: "print"; print: LogosPrintAction },
  host: LogosHost,
) {
  if (offer.type === "navigate") {
    if (hasCapability(host.profile, "navigate.local")) {
      runNavigateLocal(offer.navigate);
      return;
    }
    const path = libraryPathForNavigate(offer.navigate, host.slugPrefix);
    const app =
      offer.navigate.kind === "service" ||
      offer.navigate.kind === "services" ||
      offer.navigate.kind === "agenda"
        ? planningAppId(host.profile)
        : musicAppId(host.profile);
    dispatchAiOpenApp({
      app,
      path,
      openIn: "same",
      reason: offer.navigate.reason ?? "open",
    });
    return;
  }

  if (hasCapability(host.profile, "print")) {
    runPrintLocal(offer.print);
    return;
  }
  dispatchAiOpenApp({
    app: musicAppId(host.profile),
    path: libraryPathForPrint(offer.print, host.slugPrefix),
    openIn: "same",
    reason: offer.print.reason ?? "print",
  });
}

/** Stage propose actions into the tray (host-agnostic). */
export function stageProposalActions(actions: LogosAction[]): void {
  for (const action of actions) {
    if (action.type !== "propose") continue;
    const p = action.proposal;
    if (p.kind === "song") {
      const payload = p.payload as { content: string; artist?: string };
      aiProposals.stageSong({
        songId: p.entityId,
        content: payload.content,
        title: p.title,
        artist: typeof payload.artist === "string" ? payload.artist : p.subtitle,
        source: p.source,
      });
    } else if (p.kind === "service") {
      const payload = p.payload as {
        elements: Parameters<typeof aiProposals.stageService>[0]["elements"];
        name?: string;
        notes?: string;
      };
      aiProposals.stageService({
        serviceId: p.entityId,
        elements: payload.elements,
        name: payload.name ?? p.title,
        notes: payload.notes,
        source: p.source,
      });
    }
  }
}

/**
 * Apply side-effects for tool actions.
 * Proposals are staged; navigate/print honor host capabilities; openApp always runs.
 */
export function dispatchLogosActions(actions: LogosAction[], host: LogosHost): void {
  stageProposalActions(actions);

  for (const action of actions) {
    switch (action.type) {
      case "propose":
      case "confirm":
        break;
      case "navigate":
        if (hasCapability(host.profile, "navigate.local")) {
          runNavigateLocal(action.navigate);
        }
        break;
      case "print":
        if (hasCapability(host.profile, "print")) {
          runPrintLocal(action.print);
        }
        break;
      case "sync":
        break;
      case "openApp":
        dispatchAiOpenApp(action.openApp);
        break;
      default:
        break;
    }
  }
}
