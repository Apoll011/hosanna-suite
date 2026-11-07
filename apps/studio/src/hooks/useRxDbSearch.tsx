import { useI18n } from "@/src/lib/i18n";
import { Calendar, Folder as FolderIcon, Music } from "lucide-react";
import { useEffect, useState } from "react";
import { CommandAction } from "../command-palette.types";
import { useCommandPalette } from "../contexts/CommandPaletteContext";
import { Folder, Service, Song } from "../types";

interface UseRxDbSearchProps {
  slugPrefix: string;
  navigate: (path: string) => void;
  isDataLoading?: boolean;
  searchSongsDb: (query: string) => Promise<Song[]>;
  searchFoldersDb: (query: string) => Promise<Folder[]>;
  searchServicesDb: (query: string) => Promise<Service[]>;
  getFolderPathString: (parentId?: string | null) => string;
}

export function useRxDbSearch({
  slugPrefix,
  navigate,
  isDataLoading = false,
  searchSongsDb,
  searchFoldersDb,
  searchServicesDb,
  getFolderPathString,
}: UseRxDbSearchProps) {
  const {
    searchQuery,
    registerDynamicActions,
    unregisterDynamicActions,
    closePalette,
  } = useCommandPalette();
  const { t, tc, locale } = useI18n();
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    // Hide dynamic items unless user types >= 2 characters
    if (trimmed.length < 2) {
      unregisterDynamicActions("rxdb-results");
      setIsDebouncing(false);
      return;
    }

    let isSubscribed = true;
    setIsDebouncing(true);

    const timer = setTimeout(async () => {
      try {
        const [songs, folders, services] = await Promise.all([
          searchSongsDb(trimmed),
          searchFoldersDb(trimmed),
          searchServicesDb(trimmed),
        ]);

        if (!isSubscribed) return;

        const results: CommandAction[] = [];

        // Folders
        folders.forEach((f) => {
          results.push({
            id: `folder-${f.id}`,
            name: f.name,
            subtitle: `${getFolderPathString(f.parentId)} (${tc("songsPage.subtitle", f.songCount || 0)})`,
            keywords: `${f.name} pasta folder diretorio`,
            section: t("common.folders"),
            icon: <FolderIcon className="w-4 h-4 text-amber-500" />,
            perform: () => {
              navigate(`${slugPrefix}/folders?id=${f.id}`);
              closePalette();
            },
          });
        });

        // Songs
        songs.forEach((s) => {
          results.push({
            id: `song-${s.id}`,
            name: s.title,
            subtitle: s.artist || t("forms.unknownArtist"),
            badge: undefined,
            keywords: `${s.title} ${s.artist || ""} ${(s.tags || []).join(" ")} musica cantico`,
            section: t("common.songs"),
            icon: <Music className="w-4 h-4 text-sky-500" />,
            perform: () => {
              navigate(`${slugPrefix}/songs/${s.id}`);
              closePalette();
            },
          });
        });

        // Services
        services.forEach((srv) => {
          results.push({
            id: `service-${srv.id}`,
            name: srv.name,
            subtitle: new Date(srv.date).toLocaleDateString(locale),
            keywords: `${srv.name} culto reuniao plano`,
            section: t("common.services"),
            icon: <Calendar className="w-4 h-4 text-emerald-500" />,
            perform: () => {
              navigate(`${slugPrefix}/services/${srv.id}`);
              closePalette();
            },
          });
        });

        registerDynamicActions("rxdb-results", results);
      } catch (err) {
        console.error("Erro na pesquisa:", err);
      } finally {
        if (isSubscribed) setIsDebouncing(false);
      }
    }, 120); // Fast 120ms debounce for loaded data

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [
    searchQuery,
    searchSongsDb,
    searchFoldersDb,
    searchServicesDb,
    slugPrefix,
    navigate,
    getFolderPathString,
    registerDynamicActions,
    unregisterDynamicActions,
    closePalette,
    t,
    tc,
    locale,
  ]);

  return {
    isSearching:
      isDebouncing || (searchQuery.trim().length >= 2 && isDataLoading),
  };
}
