/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
