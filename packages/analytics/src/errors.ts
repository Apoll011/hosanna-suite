export interface FormattedErrorDetails {
  message: string;
  name?: string;
  stack?: string;
  digest?: string;
  [key: string]: unknown;
}

export function formatError(
  error: unknown,
  extraProps?: Record<string, unknown>,
): {
  errorInstance: Error;
  properties: FormattedErrorDetails;
} {
  const properties: FormattedErrorDetails = {
    message: "Unknown error",
    ...extraProps,
  };

  if (error instanceof Error) {
    properties.message = error.message;
    properties.name = error.name;
    properties.stack = error.stack;

    const withDigest = error as Error & { digest?: string };
    if (typeof withDigest.digest === "string") {
      properties.digest = withDigest.digest;
    }

    return { errorInstance: error, properties };
  }

  if (typeof error === "string") {
    properties.message = error;
    return { errorInstance: new Error(error), properties };
  }

  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === "string") {
      properties.message = errorObj.message;
    }
    if (typeof errorObj.name === "string") {
      properties.name = errorObj.name;
    }
    if (typeof errorObj.digest === "string") {
      properties.digest = errorObj.digest;
    }
    Object.assign(properties, errorObj);
    return { errorInstance: new Error(properties.message), properties };
  }

  properties.message = String(error);
  return { errorInstance: new Error(properties.message), properties };
}
