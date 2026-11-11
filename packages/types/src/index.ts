export type { $defs, components, operations, paths, webhooks } from "./schema";

import type { components, operations, paths } from "./schema";

/** Named schema from the OpenAPI spec, e.g. `ApiSchema<"Song">`. */
export type ApiSchema<Name extends keyof components["schemas"]> = components["schemas"][Name];

/** Operation by OpenAPI `operationId`, e.g. `ApiOperation<"pullCollection">`. */
export type ApiOperation<Op extends keyof operations> = operations[Op];

/** Path item for a concrete OpenAPI path key. */
export type ApiPath<P extends keyof paths> = paths[P];
