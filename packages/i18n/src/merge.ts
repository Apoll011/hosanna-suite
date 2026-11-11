/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeTwo(a: unknown, b: unknown): unknown {
  if (!isPlainObject(a)) return b;
  if (!isPlainObject(b)) return b;
  const out: PlainObject = { ...a };
  for (const [key, value] of Object.entries(b)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = mergeTwo(out[key], value) as PlainObject;
    } else if (isPlainObject(value)) {
      out[key] = mergeTwo({}, value) as PlainObject;
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Deep-merge message dictionaries. Later sources win on conflicts.
 * Arrays are replaced (not concatenated) so locale lists stay explicit.
 */
export function deepMerge<A>(a: A): A;
export function deepMerge<A, B>(a: A, b: B): A & B;
export function deepMerge<A, B, C>(a: A, b: B, c: C): A & B & C;
export function deepMerge<A, B, C, D>(a: A, b: B, c: C, d: D): A & B & C & D;
export function deepMerge(...sources: unknown[]): unknown {
  return sources.reduce((acc, source) => mergeTwo(acc, source), {});
}
