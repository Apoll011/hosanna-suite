/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type { ResourceDefinition, ResourceDomainId, ResourceKind, StagedProposal } from "./types";
export { getResource, getResourceByDomainId, listResources, registerResource } from "./registry";
export { songResource, songContentOf } from "./song";
export { serviceResource, serviceElementsOf, type ServiceProposalPayload } from "./service";
export { libraryPathForNavigate, libraryPathForPrint, songPath, servicePath } from "./paths";
