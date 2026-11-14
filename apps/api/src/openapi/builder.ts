import { z } from "zod";

export interface OpenApiParameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: Record<string, unknown>;
}

export interface OpenApiOperation {
  tags?: string[];
  summary: string;
  description?: string;
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    description?: string;
    content: {
      "application/json"?: { schema: Record<string, unknown> };
      [mediaType: string]: unknown;
    };
  };
  responses: Record<
    string | number,
    {
      description: string;
      content?: {
        "application/json"?: { schema: Record<string, unknown> };
        [mediaType: string]: unknown;
      };
    }
  >;
}

export const sessionAuth: Array<Record<string, string[]>> = [
  { cookieAuth: [] },
  { bearerAuth: [] },
];
export const cronAuth: Array<Record<string, string[]>> = [{ cronSecret: [] }];

export function safeToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  return z.toJSONSchema(schema, {
    unrepresentable: ({ zodSchema }) => {
      const type = (zodSchema as any)?._zod?.def?.type;
      if (type === "date") {
        return { type: "string", format: "date-time" };
      }
      return { type: "string" };
    },
  }) as Record<string, unknown>;
}

export function cleanJsonSchema(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return (raw as Record<string, unknown>) ?? {};
  }
  const copy = { ...(raw as Record<string, unknown>) };
  delete copy["$schema"];

  if (Array.isArray(copy.required) && copy.properties && typeof copy.properties === "object") {
    const props = copy.properties as Record<string, Record<string, unknown>>;
    copy.required = (copy.required as string[]).filter(
      (key) => props[key]?.default === undefined,
    );
    if ((copy.required as string[]).length === 0) {
      delete copy.required;
    }
  }

  return copy;
}

export function zodToSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  return cleanJsonSchema(safeToJsonSchema(schema));
}

export function zodToQueryParams(schema: z.ZodObject<any, any>): OpenApiParameter[] {
  const json = safeToJsonSchema(schema) as Record<string, any>;
  const properties = (json.properties || {}) as Record<string, any>;
  const requiredSet = new Set<string>(json.required || []);

  return Object.entries(properties).map(([name, propSchema]) => {
    const isRequired = requiredSet.has(name) && propSchema.default === undefined;
    const cleanProp = cleanJsonSchema(propSchema);
    return {
      name,
      in: "query",
      required: isRequired,
      description: (cleanProp.description as string) || undefined,
      schema: cleanProp,
    };
  });
}

export function zodToPathParams(schema: z.ZodObject<any, any>): OpenApiParameter[] {
  const json = safeToJsonSchema(schema) as Record<string, any>;
  const properties = (json.properties || {}) as Record<string, any>;

  return Object.entries(properties).map(([name, propSchema]) => {
    const cleanProp = cleanJsonSchema(propSchema);
    return {
      name,
      in: "path",
      required: true,
      description: (cleanProp.description as string) || undefined,
      schema: cleanProp,
    };
  });
}

export function jsonBody(
  schemaOrRef: z.ZodTypeAny | Record<string, unknown>,
  opts: { description?: string; required?: boolean } = {},
) {
  const schema =
    schemaOrRef instanceof z.ZodType ? zodToSchema(schemaOrRef) : schemaOrRef;
  return {
    required: opts.required ?? true,
    description: opts.description,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

export function jsonResp(
  status: number | string,
  schemaOrRef: z.ZodTypeAny | Record<string, unknown>,
  description = "OK",
) {
  const schema =
    schemaOrRef instanceof z.ZodType ? zodToSchema(schemaOrRef) : schemaOrRef;
  return {
    [status]: {
      description,
      content: {
        "application/json": {
          schema,
        },
      },
    },
  };
}

export function op(
  summary: string,
  options: Partial<OpenApiOperation> = {},
): OpenApiOperation {
  const responses = options.responses || {
    200: { description: "OK" },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Error" },
        },
      },
    },
  };

  return {
    summary,
    responses,
    ...(options.tags ? { tags: options.tags } : {}),
    ...(options.description ? { description: options.description } : {}),
    ...(options.operationId ? { operationId: options.operationId } : {}),
    ...(options.security ? { security: options.security } : {}),
    ...(options.parameters ? { parameters: options.parameters } : {}),
    ...(options.requestBody ? { requestBody: options.requestBody } : {}),
  };
}
