/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tool output → typed actions. One pipeline for every host.
 */

import type { ResourceKind, StagedProposal } from "../resources/types";

export type ConfirmActionKind =
  "delete_song" | "delete_service" | "delete_folder" | "delete_collection" | "delete_agenda";

export type LogosConfirmAction = {
  action: ConfirmActionKind;
  id: string;
  title: string;
  detail?: string;
  folderAction?: "move_to_root" | "delete_songs";
};

export type LogosNavigateAction = {
  kind: string;
  id?: string | null;
  route?: string;
  reason?: string;
};

export type LogosPrintAction = {
  kind: string;
  ids: string[];
  title?: string;
  reason?: string;
  options?: Record<string, unknown>;
};

export type LogosOpenAppAction = {
  app: string;
  path: string;
  openIn: "same" | "new";
  reason?: string;
};

export type LogosAction =
  | { type: "propose"; proposal: StagedProposal; toolName?: string }
  | { type: "confirm"; confirmation: LogosConfirmAction }
  | { type: "navigate"; navigate: LogosNavigateAction }
  | { type: "print"; print: LogosPrintAction }
  | { type: "openApp"; openApp: LogosOpenAppAction }
  | { type: "sync"; reason?: string };

export type DeferredHostOffer =
  { type: "navigate"; navigate: LogosNavigateAction } | { type: "print"; print: LogosPrintAction };

/** Page ids used to fill missing proposal entity ids. */
export type ActionPageContext = {
  songId?: string;
  serviceId?: string;
  title?: string;
};
