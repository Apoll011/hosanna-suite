// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { Suspense, type ReactNode } from "react";
import { Spinner } from "@hosanna/ui";

export function SuspensePage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <Spinner size="md" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
