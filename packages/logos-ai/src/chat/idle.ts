/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IdleHost = {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout: (cb: () => void, ms: number) => unknown;
  clearTimeout: (handle: never) => void;
};

export function scheduleIdle(
  task: () => void,
  host: IdleHost = globalThis as unknown as IdleHost,
  timeoutMs = 2000,
): () => void {
  if (host.requestIdleCallback && host.cancelIdleCallback) {
    const handle = host.requestIdleCallback(task, { timeout: timeoutMs });
    return () => host.cancelIdleCallback?.(handle);
  }
  const handle = host.setTimeout(task, timeoutMs);
  return () => host.clearTimeout(handle as never);
}
