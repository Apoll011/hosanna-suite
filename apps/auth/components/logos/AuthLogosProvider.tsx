"use client";

import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { getStudioUrl } from "@/lib/auth/redirect";
import { navigateToStudioApp, prefetchStudioApp } from "@/lib/auth/studio-handoff";
import { aiApi } from "@/lib/services/ai-api";
import { apiFetch } from "@/lib/services/api";
import { writeThemeCookie } from "@/lib/ui/theme-boot";
import { useI18n } from "@/lib/ui/i18n";
import {
  AiChatDock,
  AiChatProvider,
  AiChatToggle,
  AI_OPEN_APP_EVENT,
  AUTH_HOST_PROFILE,
  createHttpCatalog,
  createLogosHost,
  LogosHostProvider,
  LogosRouteProvider,
  LogosSongAdapterProvider,
  performOpenApp,
  resolveHosannaAppOrigin,
  type AiOpenAppDetail,
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
      if ((detail.openIn ?? "same") !== "new" && (app === "studio" || app === "music")) {
        navigateToStudioApp({ path: detail.path || "/" });
        return;
      }
      performOpenApp(detail, {
        resolveOrigin: (id) =>
          resolveHosannaAppOrigin(id, {
            overrides: {
              auth: typeof window !== "undefined" ? window.location.origin : undefined,
              studio: getStudioUrl(),
              music: getStudioUrl(),
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

/** Thin Auth mount: profile + HTTP catalog + chat. */
export function AuthLogosProvider({ children }: { children: ReactNode }) {
  const { t, tc, language, locale } = useI18n();
  const { user, organization } = useActiveOrganization();
  const { granted: canUseAi } = useCan("ai.use");
  const { granted: canUpdateSong } = useCan("song.update");
  const { granted: canUpdateService } = useCan("service.update");
  const pathname = usePathname() || "/account";
  const orgId = organization?.id;
  const orgSlug = organization?.slug;

  const catalog = useMemo(
    () =>
      createHttpCatalog({
        request: apiFetch,
        organizationId: orgId,
        canUpdate: { song: canUpdateSong, service: canUpdateService },
      }),
    [orgId, canUpdateSong, canUpdateService],
  );

  const host = useMemo(
    () =>
      createLogosHost({
        profile: AUTH_HOST_PROFILE,
        catalog,
        chat: {
          getSettings: () => {
            if (!orgId) return Promise.reject(new Error("No organization"));
            return aiApi.getSettings({ organizationId: orgId });
          },
          streamChat: (body) => {
            if (!orgId) return Promise.reject(new Error("No organization"));
            return aiApi.streamChat(body, { organizationId: orgId });
          },
          confirmAction: (body) => {
            if (!orgId) return Promise.reject(new Error("No organization"));
            return aiApi.confirmAction(body, { organizationId: orgId });
          },
        },
        t: t as Parameters<typeof createLogosHost>[0]["t"],
        tc: tc as Parameters<typeof createLogosHost>[0]["tc"],
        language,
        locale,
        userName: user?.name,
        scope: orgId && user?.id ? `${orgId}:${user.id}` : null,
        slugPrefix: orgSlug ? `/${orgSlug}` : "",
        canUseAi,
        deriveView: deriveAccountView,
      }),
    [catalog, t, tc, language, locale, user?.name, user?.id, orgId, orgSlug, canUseAi],
  );

  return (
    <LogosHostProvider value={host}>
      <LogosSongAdapterProvider value={NOOP_SONGS}>
        <LogosRouteProvider pathname={pathname} params={{}}>
          <AiChatProvider>
            <AuthOpenAppListener />
            <div className="h-dvh max-h-dvh w-full flex flex-row overflow-hidden bg-m3-bg">
              <div className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain">
                {children}
              </div>
              <AiChatDock />
            </div>
          </AiChatProvider>
        </LogosRouteProvider>
      </LogosSongAdapterProvider>
    </LogosHostProvider>
  );
}

export function AuthLogosToggle() {
  return <AiChatToggle />;
}
