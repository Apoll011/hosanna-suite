import { mapToolError } from "./toolErrors.js";

export const MAX_BATCH = 25;

export type BatchErrorHandler<I> = (
  error: unknown,
  item: I,
) => Record<string, unknown> | Promise<Record<string, unknown>>;

export async function runBatch<I>(
  items: I[],
  fn: (item: I) => Promise<object>,
  onError: BatchErrorHandler<I> = (error) => mapToolError(error),
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: Array<Record<string, unknown>>;
}> {
  const results: Array<Record<string, unknown>> = [];
  for (let index = 0; index < items.length; index++) {
    try {
      results.push({ index, ok: true, ...(await fn(items[index])) });
    } catch (error) {
      results.push({ index, ok: false, ...(await onError(error, items[index])) });
    }
  }
  const failed = results.filter((result) => result.ok === false).length;
  return {
    total: items.length,
    succeeded: items.length - failed,
    failed,
    results,
  };
}
