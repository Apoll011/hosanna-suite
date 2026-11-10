/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from "react";
import type { LogosHost, LogosTc, LogosTranslate } from "./types";

const LogosHostCtx = createContext<LogosHost | null>(null);

export function LogosHostProvider({
  value,
  children,
}: {
  value: LogosHost;
  children: React.ReactNode;
}) {
  return <LogosHostCtx.Provider value={value}>{children}</LogosHostCtx.Provider>;
}

export function useLogosHost(): LogosHost {
  const host = useContext(LogosHostCtx);
  if (!host) {
    throw new Error("useLogosHost must be used within LogosHostProvider");
  }
  return host;
}

export function useLogosI18n(): {
  t: LogosTranslate;
  tc: LogosTc;
  language: string;
  locale: string;
} {
  const { t, tc, language, locale } = useLogosHost();
  return { t, tc, language, locale };
}
