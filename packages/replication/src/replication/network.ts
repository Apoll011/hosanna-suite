/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const TRANSIENT_NETWORK_MESSAGES = [
  "Failed to fetch",
  "NetworkError",
  "Load failed",
  "Network request failed",
  "The network connection was lost",
  "ERR_NETWORK",
];

export function isTransientNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return TRANSIENT_NETWORK_MESSAGES.some((message) => error.message.includes(message));
}
