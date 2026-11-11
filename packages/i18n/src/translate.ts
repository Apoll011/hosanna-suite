/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Interpolation = Record<string, string | number>;

/** Walk a nested dictionary by dot-path; `undefined` when any segment is missing. */
export function lookup(dict: unknown, key: string): unknown {
  if (dict == null || typeof dict !== "object") return undefined;
  const parts = key.split(".");
  let node: unknown = dict;
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as object)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return node;
}

/** Replace `{name}` placeholders; unknown names are left as-is. */
export function interpolate(template: string, vars?: Interpolation): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : match,
  );
}

/** Look up a string leaf and interpolate it; `undefined` for missing or non-string nodes. */
export function resolveString(
  dict: unknown,
  key: string,
  vars?: Interpolation,
): string | undefined {
  const value = lookup(dict, key);
  if (typeof value === "string") return interpolate(value, vars);
  return undefined;
}
