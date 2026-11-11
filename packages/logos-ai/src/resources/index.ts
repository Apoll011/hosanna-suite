/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type { ResourceDefinition, ResourceKind, StagedProposal } from "./types";
export { getResource, listResources, registerResource } from "./registry";
export { songResource, songContentOf } from "./song";
export { serviceResource, serviceElementsOf, type ServiceProposalPayload } from "./service";
export {
  libraryPathForNavigate,
  libraryPathForPrint,
  songPath,
  servicePath,
} from "./paths";
