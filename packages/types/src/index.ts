export type { $defs, components, operations, paths, webhooks } from "./schema";

import type { components } from "./schema";

/** Named schema from the OpenAPI spec, e.g. `ApiSchema<"Song">`. */
export type ApiSchema<Name extends keyof components["schemas"]> = components["schemas"][Name];
