/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Format a byte count for display (e.g. "1.2 MB").
 * Uses binary units (KiB/MiB) with short SI-style labels common in UIs.
 */
export function formatBytes(bytes: number, locale?: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }

  const units = ["KB", "MB", "GB", "TB"] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: value >= 10 ? 0 : 1,
    minimumFractionDigits: 0,
  }).format(value);

  return `${formatted} ${units[unitIndex]}`;
}
