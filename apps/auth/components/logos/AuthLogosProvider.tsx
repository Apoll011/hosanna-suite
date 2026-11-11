"use client";

import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { aiApi } from "@/lib/services/ai-api";
import { useI18n } from "@/lib/ui/i18n";
import { getStudioUrl } from "@/lib/auth/redirect";
import { navigateToStudioApp, prefetchStudioApp } from "@/lib/auth/studio-handoff";
import { writeThemeCookie } from "@/lib/ui/theme-boot";
import {
  AiChatDock,
  AiChatProvider,
  AiChatToggle,
  AI_OPEN_APP_EVENT,
  LogosHostProvider,
  LogosRouteProvider,
  LogosSongAdapterProvider,
  performOpenApp,
  resolveHosannaAppOrigin,
  type AiOpenAppDetail,
  type LogosHost,
  type LogosSongAdapter,
} from "@hosanna/logos-ai";
import { useCan } from "@hosanna/ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";

const NOOP_SONGS: LogosSongAdapter = {
  useSong: () => ({ data: null, isLoading: false }),
  useUpdateSong: () => async () => undefined,
};

function deriveAccountView(_pathname: string, _slugPrefix: string): string {
  return "general";
}

function AuthOpenAppListener() {
  const router = useRouter();

  useEffect(() => {
    // Idle-warm Studio so open_app({ app: "studio", openIn: "same" }) feels instant.
    const ric =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback.bind(window)
        : null;
    const idleId = ric
      ? ric(() => prefetchStudioApp(), { timeout: 4000 })
      : window.setTimeout(() => prefetchStudioApp(), 1500);

    const onOpenApp = (ev: Event) => {
      const detail = (ev as CustomEvent<AiOpenAppDetail>).detail;
      if (!detail?.app) return;

      const app = detail.app.trim().toLowerCase();
      if ((detail.openIn ?? "same") !== "new" && app === "studio") {
        navigateToStudioApp({ path: detail.path || "/" });
        return;
      }

      performOpenApp(detail, {
        resolveOrigin: (id) =>
          resolveHosannaAppOrigin(id, {
            overrides: {
              auth: typeof window !== "undefined" ? window.location.origin : undefined,
              studio: getStudioUrl(),
              saas: "https://hosanna.live",
            },
          }),
        navigateSameOrigin: (path) => router.push(path),
        prepareCrossOriginNavigate: ({ url }) => {
          writeThemeCookie(document.documentElement.classList.contains("dark") ? "dark" : "light");
          return url;
        },
      });
    };
    window.addEventListener(AI_OPEN_APP_EVENT, onOpenApp);
    return () => {
      window.removeEventListener(AI_OPEN_APP_EVENT, onOpenApp);
      if (ric && typeof idleId === "number") window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId as number);
    };
  }, [router]);

  return null;
}

/**
 * Wires account-center auth/i18n/permissions into Logos AI and mounts the dock.
 */
export function AuthLogosProvider({ children }: { children: ReactNode }) {
  const { t, tc, language, locale } = useI18n();
  const { user, organization } = useActiveOrganization();
  const { granted: canUseAi } = useCan("ai.use");
  const pathname = usePathname() || "/account";

  const host = useMemo<LogosHost>(
    () => ({
      api: {
        getSettings: () => {
          if (!organization?.id) return Promise.reject(new Error("No organization"));
          return aiApi.getSettings({ organizationId: organization.id });
        },
        streamChat: (body) => {
          if (!organization?.id) return Promise.reject(new Error("No organization"));
          return aiApi.streamChat(body, { organizationId: organization.id });
        },
        confirmAction: (body) => {
          if (!organization?.id) return Promise.reject(new Error("No organization"));
          return aiApi.confirmAction(body, { organizationId: organization.id });
        },
      },
      t: t as LogosHost["t"],
      tc: tc as LogosHost["tc"],
      language,
      locale,
      userName: user?.name,
      scope: organization?.id && user?.id ? `${organization.id}:${user.id}` : null,
      slugPrefix: "",
      canUseAi,
      canUpdateSong: false,
      deriveView: deriveAccountView,
    }),
    [t, tc, language, locale, user?.name, user?.id, organization?.id, canUseAi],
  );

  return (
    <LogosHostProvider value={host}>
      <LogosSongAdapterProvider value={NOOP_SONGS}>
        <LogosRouteProvider pathname={pathname} params={{}}>
          <AiChatProvider>
            <AuthOpenAppListener />
            {children}
            <AiChatDock />
          </AiChatProvider>
        </LogosRouteProvider>
      </LogosSongAdapterProvider>
    </LogosHostProvider>
  );
}

/** Header sparkle control — only renders when Logos is available for this org. */
export function AuthLogosToggle() {
  return <AiChatToggle />;
}
