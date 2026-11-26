// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useState } from "react";

/**
 * Raw `location.search` (with `?`, or "" when empty).
 * null during SSR and the first client render so both agree; the real value
 * arrives after mount.
 */
export function useBrowserSearch(): string | null {
  const [search, setSearch] = useState<string | null>(null);

  useEffect(() => {
    setSearch(window.location.search);
  }, []);

  return search;
}
