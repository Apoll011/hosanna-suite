/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AiChatProvider,
  createCatalog,
  createLogosHost,
  LogosHostProvider,
  LogosRouteProvider,
  LogosSongAdapterProvider,
  STUDIO_HOST_PROFILE,
  type LogosSong,
  type LogosSongAdapter,
} from "@hosanna/logos-ai";
import { useCan } from "@hosanna/ui";
import React, { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { aiApi } from "../api/ai";
import { servicesApi } from "../api/services";
import { songsApi } from "../api/songs";
import { useAuth } from "../contexts/AuthContext";
import { useSong, useSongMutations } from "../hooks/useSongs";
import { deriveView } from "../layouts/view";
import { useI18n } from "../lib/i18n";
import type { ServiceElement } from "../types";

function useStudioSong(id: string | null | undefined) {
  return useSong(id ?? null);
}

function useUpdateSongFromMutations() {
  const { updateSong } = useSongMutations();
  return async (args: { id: string; data: Partial<LogosSong> }) => {
    await updateSong({ id: args.id, data: args.data });
  };
}

function StudioLogosRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const params = useParams();
  return (
    <LogosRouteProvider pathname={location.pathname} params={params}>
      {children}
    </LogosRouteProvider>
  );
}

/** Thin Studio mount: profile + catalog handlers + RxDB song adapter. */
export function StudioLogosProvider({ children }: { children: React.ReactNode }) {
  const { t, tc, language, locale } = useI18n();
  const { user, organization } = useAuth();
  const { granted: canUseAi } = useCan("ai.use");
  const { granted: canUpdateSong } = useCan("song.update");
  const { granted: canUpdateService } = useCan("service.update");

  const catalog = useMemo(
    () =>
      createCatalog({
        canUpdate: { song: canUpdateSong, service: canUpdateService },
        handlers: {
          song: {
            get: async (id) => {
              try {
                const song = await songsApi.getSongById(id);
                return {
                  id: song.id,
                  title: song.title,
                  artist: song.artist,
                  content: song.content,
                  song_number: song.song_number,
                  updatedAt: song.updatedAt,
                };
              } catch {
                return null;
              }
            },
            update: async (id, patch) => {
              await songsApi.updateSong(id, patch);
            },
          },
          service: {
            get: async (id) => {
              try {
                const service = await servicesApi.getServiceById(id);
                return {
                  id: service.id,
                  name: service.name,
                  date: service.date,
                  notes: service.notes,
                  elements: (service.elements ??
                    []) as import("@hosanna/logos-ai").CatalogServiceElement[],
                  updatedAt: service.updatedAt,
                };
              } catch {
                return null;
              }
            },
            update: async (id, patch) => {
              let updatedAt = patch.updatedAt;
              if (!updatedAt) {
                updatedAt = (await servicesApi.getServiceById(id)).updatedAt;
              }
              if (patch.elements) {
                const updated = await servicesApi.updateServiceElements(id, {
                  updatedAt,
                  elements: patch.elements as ServiceElement[],
                });
                if (patch.name !== undefined || patch.notes !== undefined) {
                  await servicesApi.updateService(id, {
                    updatedAt: updated.updatedAt,
                    ...(patch.name !== undefined ? { name: patch.name } : {}),
                    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
                  });
                }
                return;
              }
              await servicesApi.updateService(id, {
                updatedAt,
                ...(patch.name !== undefined ? { name: patch.name } : {}),
                ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
              });
            },
          },
        },
      }),
    [canUpdateSong, canUpdateService],
  );

  const host = useMemo(
    () =>
      createLogosHost({
        profile: STUDIO_HOST_PROFILE,
        catalog,
        chat: {
          getSettings: () => aiApi.getSettings(),
          streamChat: (body) => aiApi.streamChat(body),
          confirmAction: (body) => aiApi.confirmAction(body),
        },
        t: t as Parameters<typeof createLogosHost>[0]["t"],
        tc: tc as Parameters<typeof createLogosHost>[0]["tc"],
        language,
        locale,
        userName: user?.name,
        scope: organization?.id && user?.id ? `${organization.id}:${user.id}` : null,
        slugPrefix: organization?.slug ? `/${organization.slug}` : "",
        canUseAi,
        deriveView,
      }),
    [
      catalog,
      t,
      tc,
      language,
      locale,
      user?.name,
      user?.id,
      organization?.id,
      organization?.slug,
      canUseAi,
    ],
  );

  const songs = useMemo<LogosSongAdapter>(
    () => ({
      useSong: useStudioSong,
      useUpdateSong: useUpdateSongFromMutations,
    }),
    [],
  );

  return (
    <LogosHostProvider value={host}>
      <LogosSongAdapterProvider value={songs}>
        <StudioLogosRoute>
          <AiChatProvider>{children}</AiChatProvider>
        </StudioLogosRoute>
      </LogosSongAdapterProvider>
    </LogosHostProvider>
  );
}
