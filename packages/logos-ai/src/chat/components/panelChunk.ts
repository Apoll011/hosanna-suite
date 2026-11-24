/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

let panelModule: Promise<typeof import("./Panel")> | null = null;

export function loadAiChatPanel() {
  panelModule ??= import("./Panel").catch((err: unknown) => {
    panelModule = null;
    throw err;
  });
  return panelModule;
}

export function prefetchAiChatPanel(): void {
  loadAiChatPanel().catch(() => undefined);
}
