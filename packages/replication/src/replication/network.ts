/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
