/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type { ResourceDefinition, ResourceDomainId, ResourceKind, StagedProposal } from "./types";
export { getResource, getResourceByDomainId, listResources, registerResource } from "./registry";
export { songResource, songContentOf } from "./song";
export { serviceResource, serviceElementsOf, type ServiceProposalPayload } from "./service";
export { libraryPathForNavigate, libraryPathForPrint, songPath, servicePath } from "./paths";
