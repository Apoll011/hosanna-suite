/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
