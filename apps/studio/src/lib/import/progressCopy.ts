/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ToastProgress } from "@/src/contexts/SyncContext";
import type { ImportProgressEvent, ImportTranslate } from "./types";

export function describeImportProgress(
  event: ImportProgressEvent,
  t: ImportTranslate,
): { description: string; progress: ToastProgress } {
  if (event.phase === "reading") {
    return {
      description: t("layout.importProgressReading", {
        name: event.label || t("layout.importProgressFiles"),
      }),
      progress: {
        value: event.done,
        total: Math.max(1, event.total),
        indeterminate: event.total <= 0,
      },
    };
  }
  if (event.phase === "processing") {
    return {
      description: t("layout.importProgressProcessing", {
        done: Math.round(event.done),
        total: Math.max(1, Math.round(event.total)),
      }),
      progress: {
        value: event.done,
        total: Math.max(1, event.total),
      },
    };
  }
  return {
    description: t("layout.importProgressWriting", {
      done: Math.round(event.done),
      total: Math.max(1, Math.round(event.total)),
    }),
    progress: {
      value: event.done,
      total: Math.max(1, event.total),
    },
  };
}
