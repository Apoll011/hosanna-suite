/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type { DomainPack, McpToolGate } from "./types.js";
export {
  registerDomainPack,
  getDomainPack,
  listDomainPacks,
  allPackToolGates,
  allPackToolNames,
  toolGateByName,
  packForTool,
  allPackPermissions,
  registerAllDomainPacks,
  clearDomainPacks,
} from "./registry.js";
export { DOMAIN_PACKS, ensureDomainPacksRegistered } from "./packs.js";
export { wireHosannaDomainPacks } from "./wire.js";
export { createSharedEmbeddedTools, mountSharedDomainTools } from "./toolFactory.js";
export {
  summarizeDomainsForUser,
  toolAvailabilityForUser,
  allowedToolNames,
  permissionsReportForUser,
  toolGroupsFromPacks,
  packCatalogSnapshot,
  assertPackToolsCoverCatalog,
  type ToolAvailability,
  type DomainCapabilitiesSummary,
} from "./discovery.js";
