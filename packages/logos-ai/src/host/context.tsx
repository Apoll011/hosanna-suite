/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_LANGUAGE, resolveString, type Language } from "@hosanna/i18n";
import React, { createContext, useContext, useMemo } from "react";
import { logosAiMessages } from "../i18n";
import { thinHostProfile } from "../kernel/capabilities";
import type { LogosHost, LogosTc, LogosTranslate } from "../kernel/host";

const LogosHostCtx = createContext<LogosHost | null>(null);

function asLanguage(value: string): Language {
  if (value === "en" || value === "es" || value === "pt") return value;
  return DEFAULT_LANGUAGE;
}

function withPackageChatFallback(host: LogosHost): LogosHost {
  const language = asLanguage(host.language);
  const dict = logosAiMessages[language] ?? logosAiMessages[DEFAULT_LANGUAGE];
  const fallbackDict = logosAiMessages[DEFAULT_LANGUAGE];

  const t: LogosTranslate = (key, vars) => {
    const fromHost = host.t(key, vars);
    if (fromHost && fromHost !== key) return fromHost;

    const fromPackage = resolveString(dict, key, vars);
    if (fromPackage !== undefined) return fromPackage;

    if (language !== DEFAULT_LANGUAGE) {
      const fromDefault = resolveString(fallbackDict, key, vars);
      if (fromDefault !== undefined) return fromDefault;
    }

    return fromHost || key;
  };

  const tc: LogosTc = (key, count, vars) => {
    const form = count === 1 ? "one" : "other";
    return t(`${key}.${form}`, { ...vars, count });
  };

  return { ...host, t, tc };
}

function withDefaults(host: LogosHost): LogosHost {
  return {
    ...host,
    canUpdateSong: host.canUpdateSong ?? host.catalog.canUpdate("song"),
    canUpdateService: host.canUpdateService ?? host.catalog.canUpdate("service"),
    profile: host.profile?.appId ? host.profile : thinHostProfile("unknown"),
  };
}

export function LogosHostProvider({
  value,
  children,
}: {
  value: LogosHost;
  children: React.ReactNode;
}) {
  const enhanced = useMemo(() => withPackageChatFallback(withDefaults(value)), [value]);
  return <LogosHostCtx.Provider value={enhanced}>{children}</LogosHostCtx.Provider>;
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
