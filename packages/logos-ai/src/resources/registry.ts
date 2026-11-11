/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { songResource } from "./song";
import { serviceResource } from "./service";
import type { ResourceDefinition, ResourceKind } from "./types";

const RESOURCES: Record<ResourceKind, ResourceDefinition> = {
  song: songResource as ResourceDefinition,
  service: serviceResource as ResourceDefinition,
};

export function getResource(kind: ResourceKind): ResourceDefinition {
  const def = RESOURCES[kind];
  if (!def) throw new Error(`Unknown Logos resource: ${kind}`);
  return def;
}

export function listResources(): ResourceDefinition[] {
  return Object.values(RESOURCES);
}

/** Look up a Logos resource by MCP / auth domain id (`music.song`). */
export function getResourceByDomainId(domainId: string): ResourceDefinition | undefined {
  return Object.values(RESOURCES).find((r) => r.domainId === domainId);
}

/** Register another resource later (presenter cues, finance funds, …). */
export function registerResource(def: ResourceDefinition): void {
  RESOURCES[def.kind] = def;
}
