"use client";

import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { aiApi } from "@/lib/services/ai-api";
import { servicesApi } from "@/lib/services/services-api";
import { songsApi } from "@/lib/services/songs-api";
import { useI18n } from "@/lib/ui/i18n";
import { getStudioUrl } from "@/lib/auth/redirect";
import { navigateToStudioApp, prefetchStudioApp } from "@/lib/auth/studio-handoff";
import { writeThemeCookie } from "@/lib/ui/theme-boot";
import {
  AiChatDock,
  AiChatProvider,
  AiChatToggle,
  AI_OPEN_APP_EVENT,
  AUTH_HOST_PROFILE,
  LogosHostProvider,
  LogosRouteProvider,
  LogosSongAdapterProvider,
  performOpenApp,
  resolveHosannaAppOrigin,
  type AiOpenAppDetail,
  type LogosHost,
  type LogosService,
  type LogosSong,
  type LogosSongAdapter,
} from "@hosanna/logos-ai";
import { useCan } from "@hosanna/ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";

/** Thin host: no in-app song cache — Logos loads songs via LogosApi catalog. */
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
      // Music is still served by Studio until the Music split lands.
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

/**
 * Wires account-center auth/i18n/permissions into Logos AI and mounts the dock.
 * Song/service proposals Accept in chat via API; Open in Music is optional.
 */
export function AuthLogosProvider({ children }: { children: ReactNode }) {
  const { t, tc, language, locale } = useI18n();
  const { user, organization } = useActiveOrganization();
  const { granted: canUseAi } = useCan("ai.use");
  const { granted: canUpdateSong } = useCan("song.update");
  const { granted: canUpdateService } = useCan("service.update");
  const pathname = usePathname() || "/account";
  const orgId = organization?.id;
  const orgSlug = organization?.slug;

  const host = useMemo<LogosHost>(() => {
    const toLogosSong = (song: {
      id: string;
      title: string;
      artist?: string | null;
      content: string;
      song_number?: number | null;
      updatedAt: string;
    }): LogosSong => ({
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      content: song.content,
      song_number: song.song_number,
      updatedAt: song.updatedAt,
    });

    const toLogosService = (service: {
      id: string;
      name: string;
      date?: string;
      notes?: string | null;
      elements?: LogosService["elements"];
      updatedAt: string;
    }): LogosService => ({
      id: service.id,
      name: service.name,
      date: service.date,
      notes: service.notes,
      elements: service.elements ?? [],
      updatedAt: service.updatedAt,
    });

    return {
      api: {
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
        getSong: async (id) => {
          if (!orgId) return null;
          const song = await songsApi.getById(id, { organizationId: orgId });
          return song ? toLogosSong(song) : null;
        },
        updateSong: async (id, data) => {
          if (!orgId) throw new Error("No organization");
          let updatedAt = data.updatedAt;
          if (!updatedAt) {
            const current = await songsApi.getById(id, { organizationId: orgId });
            if (!current) throw new Error("Song not found");
            updatedAt = current.updatedAt;
          }
          const updated = await songsApi.update(
            id,
            {
              updatedAt,
              ...(data.title !== undefined ? { title: data.title } : {}),
              ...(data.artist !== undefined ? { artist: data.artist } : {}),
              ...(data.content !== undefined ? { content: data.content } : {}),
              ...(data.song_number !== undefined ? { song_number: data.song_number } : {}),
            },
            { organizationId: orgId },
          );
          return toLogosSong(updated);
        },
        getService: async (id) => {
          if (!orgId) return null;
          const service = await servicesApi.getById(id, { organizationId: orgId });
          return service ? toLogosService(service) : null;
        },
        updateService: async (id, data) => {
          if (!orgId) throw new Error("No organization");
          let updatedAt = data.updatedAt;
          if (!updatedAt) {
            const current = await servicesApi.getById(id, { organizationId: orgId });
            if (!current) throw new Error("Service not found");
            updatedAt = current.updatedAt;
          }
          if (data.elements) {
            const updated = await servicesApi.updateElements(
              id,
              { updatedAt, elements: data.elements },
              { organizationId: orgId },
            );
            // Name/notes may still need a follow-up PUT when provided.
            if (data.name !== undefined || data.notes !== undefined) {
              const again = await servicesApi.update(
                id,
                {
                  updatedAt: updated.updatedAt,
                  ...(data.name !== undefined ? { name: data.name } : {}),
                  ...(data.notes !== undefined ? { notes: data.notes } : {}),
                },
                { organizationId: orgId },
              );
              return toLogosService({ ...again, elements: data.elements });
            }
            return toLogosService({ ...updated, elements: data.elements });
          }
          const updated = await servicesApi.update(
            id,
            {
              updatedAt,
              ...(data.name !== undefined ? { name: data.name } : {}),
              ...(data.notes !== undefined ? { notes: data.notes } : {}),
            },
            { organizationId: orgId },
          );
          return toLogosService(updated);
        },
      },
      t: t as LogosHost["t"],
      tc: tc as LogosHost["tc"],
      language,
      locale,
      userName: user?.name,
      scope: orgId && user?.id ? `${orgId}:${user.id}` : null,
      // Used when the user optionally opens Music via open_app.
      slugPrefix: orgSlug ? `/${orgSlug}` : "",
      canUseAi,
      canUpdateSong,
      canUpdateService,
      deriveView: deriveAccountView,
      profile: AUTH_HOST_PROFILE,
    };
  }, [
    t,
    tc,
    language,
    locale,
    user?.name,
    user?.id,
    orgId,
    orgSlug,
    canUseAi,
    canUpdateSong,
    canUpdateService,
  ]);

  return (
    <LogosHostProvider value={host}>
      <LogosSongAdapterProvider value={NOOP_SONGS}>
        <LogosRouteProvider pathname={pathname} params={{}}>
          <AiChatProvider>
            <AuthOpenAppListener />
            {/*
              Same shell as Studio MainLayout: dock is a flex sibling of the page.
              Without this, AiChatDock's sm:static mode drops below the full-page
              AccountShell — viewport jumps to the chat and the fixed AccountNav
              overlays it while account content scrolls away.
            */}
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

/** Header sparkle control — only renders when Logos is available for this org. */
export function AuthLogosToggle() {
  return <AiChatToggle />;
}
