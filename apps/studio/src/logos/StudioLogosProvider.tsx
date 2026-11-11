/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AiChatProvider,
  LogosHostProvider,
  LogosRouteProvider,
  LogosSongAdapterProvider,
  STUDIO_HOST_PROFILE,
  type LogosHost,
  type LogosSong,
  type LogosSongAdapter,
} from "@hosanna/logos-ai";
import React, { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { aiApi } from "../api/ai";
import { songsApi } from "../api/songs";
import { useAuth } from "../contexts/AuthContext";
import { useSong, useSongMutations } from "../hooks/useSongs";
import { deriveView } from "../layouts/view";
import { useI18n } from "../lib/i18n";
import { useCan } from "@hosanna/ui";

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

/**
 * Wires Studio auth/i18n/permissions/songs into Logos AI and mounts the chat provider.
 */
export function StudioLogosProvider({ children }: { children: React.ReactNode }) {
  const { t, tc, language, locale } = useI18n();
  const { user, organization } = useAuth();
  const { granted: canUseAi } = useCan("ai.use");
  const { granted: canUpdateSong } = useCan("song.update");

  const host = useMemo<LogosHost>(
    () => ({
      api: {
        getSettings: () => aiApi.getSettings(),
        streamChat: (body) => aiApi.streamChat(body),
        confirmAction: (body) => aiApi.confirmAction(body),
        // Load fallback when the RxDB adapter has not hydrated the song yet.
        // Accepts still go through LogosSongAdapter so Studio stays offline-first.
        getSong: async (id) => {
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
      },
      t: t as LogosHost["t"],
      tc: tc as LogosHost["tc"],
      language,
      locale,
      userName: user?.name,
      scope: organization?.id && user?.id ? `${organization.id}:${user.id}` : null,
      slugPrefix: organization?.slug ? `/${organization.slug}` : "",
      canUseAi,
      canUpdateSong,
      deriveView,
      profile: STUDIO_HOST_PROFILE,
    }),
    [
      t,
      tc,
      language,
      locale,
      user?.name,
      user?.id,
      organization?.id,
      organization?.slug,
      canUseAi,
      canUpdateSong,
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
