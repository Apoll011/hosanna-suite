/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AiChatProvider,
  LogosHostProvider,
  LogosSongAdapterProvider,
  type LogosHost,
  type LogosSong,
  type LogosSongAdapter,
} from "@hosanna/logos-ai";
import React, { useMemo } from "react";
import { aiApi } from "../api/ai";
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
        <AiChatProvider>{children}</AiChatProvider>
      </LogosSongAdapterProvider>
    </LogosHostProvider>
  );
}
