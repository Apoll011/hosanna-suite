/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Insert `{name: value}` among the leading ChordPro meta directives.
 * No-op if a directive with that name already exists.
 */
export function injectChordProDirective(
  content: string,
  name: string,
  value: string,
): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\{${escaped}\\s*:`, "i").test(content)) {
    return content;
  }

  const directive = `{${name}: ${value}}`;
  const lines = content.split("\n");
  let insertAt = 0;
  while (
    insertAt < lines.length &&
    /^\s*(\{[^}]*\}|\s*)$/.test(lines[insertAt])
  ) {
    if (/^\s*\{[^}]*\}/.test(lines[insertAt])) insertAt += 1;
    else break;
  }

  lines.splice(insertAt, 0, directive);
  return lines.join("\n");
}
