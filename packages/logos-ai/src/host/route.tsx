/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { createContext, useContext, useMemo } from "react";

export type LogosRouteState = {
  pathname: string;
  params: Record<string, string | undefined>;
};

const LogosRouteCtx = createContext<LogosRouteState>({
  pathname: "/",
  params: {},
});

/** Hosts push the current route here so Logos stays router-agnostic (Next, RR, …). */
export function LogosRouteProvider({
  pathname,
  params,
  children,
}: {
  pathname: string;
  params?: Record<string, string | undefined>;
  children: React.ReactNode;
}) {
  const value = useMemo<LogosRouteState>(
    () => ({ pathname, params: params ?? {} }),
    [pathname, params],
  );
  return <LogosRouteCtx.Provider value={value}>{children}</LogosRouteCtx.Provider>;
}

export function useLogosRoute(): LogosRouteState {
  return useContext(LogosRouteCtx);
}
