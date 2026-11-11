import type { FormatChange, FormatOptions, FormatResult, FormatWarning } from "./types";
import { normalizeLine } from "./normalize";

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  maxBlankLines: 1,
  normalizeNotationAliases: true,
  expandDirectiveAliases: true,
  normalizeChordLyricSpacing: true,
};

function normalizeLineEndings(content: string, changes: FormatChange[]): string {
  const original = content;
  // CRLF -> LF, then CR -> LF
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (normalized !== original) {
    changes.push({
      type: "line_ending",
      before: "CRLF/CR",
      after: "LF",
    });
  }
  return normalized;
}

function trimLeadingBlankLines(lines: string[], changes: FormatChange[]): string[] {
  let start = 0;
  while (start < lines.length && lines[start].trim() === "") {
    start++;
  }
  if (start > 0) {
    changes.push({
      type: "empty_lines",
      before: `${start} leading blank line(s)`,
      after: "removed",
    });
    return lines.slice(start);
  }
  return lines;
}

function trimTrailingBlankLines(lines: string[], changes: FormatChange[]): string[] {
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === "") {
    end--;
  }
  if (end < lines.length) {
    changes.push({
      type: "empty_lines",
      before: `${lines.length - end} trailing blank line(s)`,
      after: "removed",
    });
    return lines.slice(0, end);
  }
  return lines;
}

function collapseExcessiveBlankLines(
  lines: string[],
  maxBlankLines: number,
  changes: FormatChange[],
): string[] {
  const result: string[] = [];
  let consecutiveBlanks = 0;
  let collapsed = false;

  for (const line of lines) {
    if (line.trim() === "") {
      consecutiveBlanks++;
      if (consecutiveBlanks <= maxBlankLines) {
        result.push(line);
      } else {
        collapsed = true;
      }
    } else {
      consecutiveBlanks = 0;
      result.push(line);
    }
  }

  if (collapsed) {
    changes.push({
      type: "empty_lines",
      before: `multiple consecutive blank lines`,
      after: `at most ${maxBlankLines} blank line(s)`,
    });
  }

  return result;
}

/**
 * Format a ChordPro document.
 *
 * @param content - The raw ChordPro content to format.
 * @param options - Optional formatting options.
 * @returns A FormatResult containing the formatted content, changes, and warnings.
 *
 * @example
 * const result = formatChordPro(editorContent);
 * if (result.changed) {
 *   applyFormattedContent(result.content);
 *   console.log(`Formatted ${result.changes.length} changes`);
 * }
 */
export function formatChordPro(content: string, options?: FormatOptions): FormatResult {
  const opts: Required<FormatOptions> = { ...DEFAULT_OPTIONS, ...options };
  const allChanges: FormatChange[] = [];
  const allWarnings: FormatWarning[] = [];

  const normalized = normalizeLineEndings(content, allChanges);

  let lines = normalized.split("\n");

  lines = trimLeadingBlankLines(lines, allChanges);
  lines = trimTrailingBlankLines(lines, allChanges);

  lines = collapseExcessiveBlankLines(lines, opts.maxBlankLines, allChanges);

  const normalizedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const { content: normalizedLine, changes, warnings } = normalizeLine(lines[i], i + 1, opts);
    normalizedLines.push(normalizedLine);
    allChanges.push(...changes);
    allWarnings.push(...warnings);
  }

  const result = normalizedLines.join("\n");
  const changed = result !== content;

  return {
    content: result,
    changed,
    changes: allChanges,
    warnings: allWarnings,
  };
}
