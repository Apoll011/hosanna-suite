/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A Resource is a library entity Logos can propose/edit from any host.
 * Add a file + register it — do not fork Auth/Studio providers.
 */

import type { CatalogResourceKind, CatalogResourceMap, CatalogPatchMap } from "../catalog/types";
import type { LogosHostProfile } from "../kernel/capabilities";

export type ResourceKind = CatalogResourceKind;

export type StagedProposal = {
  kind: ResourceKind;
  entityId: string;
  /** Opaque payload stored in the proposal tray (song content / service elements…). */
  payload: unknown;
  title?: string;
  subtitle?: string;
  source?: string;
};

/**
 * Product domain id shared with `@hosanna/auth` DomainId / MCP Domain Packs
 * (`music.song`, `music.service`, …). Keep in sync when adding resources.
 */
export type ResourceDomainId = "music.song" | "music.service" | (string & {});

export type ResourceDefinition<K extends ResourceKind = ResourceKind> = {
  kind: K;
  /** Same id as MCP Domain Pack / auth DomainId. */
  domainId: ResourceDomainId;
  /** App that owns the full editor for this resource. */
  ownerApp: (profile: LogosHostProfile) => string;
  /** SPA path under org slug (for optional open). */
  pathFor: (id: string | null, slugPrefix: string) => string;
  /** Pull a proposal out of a tool result. */
  extractProposal: (output: unknown) => Omit<StagedProposal, "kind" | "source"> | null;
  /** Turn a staged proposal into a catalog patch. */
  toPatch: (proposal: StagedProposal) => CatalogPatchMap[K];
  /** Fingerprint for pending/accepted/stale status. */
  fingerprint: (proposal: StagedProposal) => string;
  /** Display helpers for cards. */
  label: (entity: CatalogResourceMap[K] | null | undefined, proposal: StagedProposal) => string;
};
