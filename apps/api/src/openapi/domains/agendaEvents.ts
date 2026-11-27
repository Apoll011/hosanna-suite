// SPDX-License-Identifier: AGPL-3.0-only
import { listAgendaEventsQuerySchema } from "../../routes/agendaEvent.routes.js";
import { idParamSchema } from "../../validators/common.validators.js";
import {
  jsonResp,
  op,
  OpenApiOperation,
  sessionAuth,
  zodToPathParams,
  zodToQueryParams,
} from "../builder.js";

export function getAgendaEventPaths(): Record<string, Record<string, OpenApiOperation>> {
  const idParam = zodToPathParams(idParamSchema);

  return {
    "/agenda-events": {
      get: op("List agenda events", {
        tags: ["Agenda"],
        operationId: "listAgendaEvents",
        security: sessionAuth,
        description: "Retrieve non-deleted agenda events ordered by date and time.",
        parameters: zodToQueryParams(listAgendaEventsQuerySchema),
        responses: jsonResp(200, {
          type: "array",
          items: { $ref: "#/components/schemas/AgendaEvent" },
        }),
      }),
    },
    "/agenda-events/{id}": {
      get: op("Get agenda event", {
        tags: ["Agenda"],
        operationId: "getAgendaEvent",
        security: sessionAuth,
        description: "Retrieve an agenda event by ID.",
        parameters: idParam,
        responses: jsonResp(200, { $ref: "#/components/schemas/AgendaEvent" }),
      }),
    },
  };
}
