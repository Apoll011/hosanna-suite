/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useI18n } from "@/src/lib/i18n";
import { Folder, Service, Song } from "@/src/types";
import {
  Button,
  Can,
  CanAny,
  InboxButton,
  usePresence,
  WorkspaceAddressBar as SharedWorkspaceAddressBar,
  type WorkspaceBreadcrumbItem,
} from "@hosanna/ui";
import {
  BarChart3,
  Calendar,
  Calendar1,
  CalendarPlus,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  HardDrive,
  LibraryBig,
  Music,
  Music2,
  Plus,
  Settings,
  Trash2Icon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ViewName } from "../../layouts/view";
import { authClient } from "../../lib/authClient";

import { AiChatToggle } from "@hosanna/logos-ai";
import { emitOnboardingEvent } from "../../lib/tour";
import { StudioAppSwitcher } from "../suite/StudioAppSwitcher";
import { SyncStatusBadge } from "../SyncStatusBadge";
import { ActiveModal } from "./ExplorerModals";

interface ExplorerAddressBarProps {
  view: ViewName;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  currentFolder: Folder | undefined;
  currentFolderId: string | null;
  slugPrefix: string;
  folderBreadcrumbs: Folder[];
  songBreadcrumbs: Folder[];
  currentSong: Song | undefined;
  currentSongFileName: string;
  currentService: Service | undefined;
  currentCollectionName?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectFolder: (id: string | null) => void;
  onNavigateBack: () => void;
  navigate: (path: string) => void;
  onOpenModal: (modal: ActiveModal) => void;
}

export const ExplorerAddressBar: React.FC<ExplorerAddressBarProps> = ({
  view,
  isSidebarOpen,
  setIsSidebarOpen,
  currentFolder,
  currentFolderId,
  slugPrefix,
  folderBreadcrumbs,
  songBreadcrumbs,
  currentSong,
  currentSongFileName,
  currentService,
  currentCollectionName,
  searchQuery,
  onSearchChange,
  onSelectFolder,
  onNavigateBack,
  navigate,
  onOpenModal,
}) => {
  const { t, locale, language } = useI18n();
  const isDriveRoot = view === "explorer" && currentFolderId === null;
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const plusMenuMounted = usePresence(isPlusMenuOpen);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const breadcrumbs: WorkspaceBreadcrumbItem[] = [
    {
      id: "home",
      label: t("common.home"),
      icon: <HardDrive className="h-4 w-4" />,
      onSelect: () => onSelectFolder(null),
      current: isDriveRoot,
    },
  ];

  if (view === "explorer") {
    folderBreadcrumbs.forEach((folder, index) =>
      breadcrumbs.push({
        id: folder.id,
        label: folder.name,
        icon:
          index === folderBreadcrumbs.length - 1 ? (
            <FolderOpen className="h-4 w-4" />
          ) : (
            <FolderIcon className="h-4 w-4 opacity-70" />
          ),
        onSelect: () => onSelectFolder(folder.id),
        current: index === folderBreadcrumbs.length - 1,
      }),
    );
  } else {
    const current = (id: string, label: string, icon: React.ReactNode, onSelect?: () => void) =>
      breadcrumbs.push({ id, label, icon, onSelect, current: !onSelect });

    if (view === "songs") current("library", t("common.library"), <Music className="h-4 w-4" />);
    if (view === "song-editor") {
      songBreadcrumbs.forEach((folder) =>
        current(folder.id, folder.name, <FolderIcon className="h-4 w-4 opacity-70" />, () => {
          onSelectFolder(folder.id);
          navigate(`${slugPrefix}/folders`);
        }),
      );
      if (currentSong) current("song", currentSongFileName, <FileText className="h-4 w-4" />);
    }
    if (view === "services")
      current("services", t("common.services"), <Calendar className="h-4 w-4" />);
    if (view === "service-editor") {
      current("services", t("common.services"), <Calendar className="h-4 w-4" />, () =>
        navigate(`${slugPrefix}/services`),
      );
      if (currentService)
        current("service", `${currentService.name}.service`, <Calendar className="h-4 w-4" />);
    }
    if (view === "settings")
      current("settings", t("common.settings"), <Settings className="h-4 w-4" />);
    if (view === "analytics")
      current("analytics", t("common.analytics"), <BarChart3 className="h-4 w-4" />);
    if (view === "agenda") current("agenda", t("common.agenda"), <Calendar1 className="h-4 w-4" />);
    if (view === "calendar")
      current("calendar", "Planning calendar", <Calendar1 className="h-4 w-4" />);
    if (view === "trash") current("trash", t("common.trash"), <Trash2Icon className="h-4 w-4" />);
    if (view === "collections")
      current("collections", t("common.collections"), <LibraryBig className="h-4 w-4" />);
    if (view === "collection-detail") {
      current(
        "collections",
        t("common.collections"),
        <LibraryBig className="h-4 w-4 opacity-70" />,
        () => navigate(`${slugPrefix}/collections`),
      );
      if (currentCollectionName)
        current("collection", currentCollectionName, <LibraryBig className="h-4 w-4" />);
    }
  }

  const searchEnabled = [
    "explorer",
    "songs",
    "services",
    "collections",
    "collection-detail",
  ].includes(view);
  const searchPlaceholder =
    view === "services"
      ? t("addressBar.searchServices")
      : view === "songs"
        ? t("addressBar.searchLibrary")
        : view === "explorer"
          ? t("addressBar.searchFolders")
          : t("addressBar.searchCollections");

  const context =
    view === "service-editor" && currentService ? (
      <span className="ml-auto mr-2 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-m3-primary/20 bg-m3-primary/10 px-3 py-1 text-xs font-medium text-m3-primary">
        <Calendar className="h-3.5 w-3.5" />
        {new Date(currentService.date).toLocaleDateString(locale, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </span>
    ) : undefined;

  const actions = (
    <>
      <div className="flex items-center gap-3 w-full md:w-auto overflow-visible hide-scrollbar pb-1 md:pb-0 justify-end">
        <SyncStatusBadge className="shrink-0" showText={false} />

        <InboxButton client={authClient} language={language} className="shrink-0" />

        <AiChatToggle />
        <StudioAppSwitcher />

        <CanAny
          permissions={[
            "song.create",
            "folder.create",
            "song.import",
            "service.create",
            "collection.create",
            "agenda.create",
          ]}
        >
          <div className="relative shrink-0 ml-1" ref={plusMenuRef}>
            <Button
              type="button"
              data-tour="toolbar-create"
              variant="primary"
              size="icon"
              onClick={() => {
                const next = !isPlusMenuOpen;
                setIsPlusMenuOpen(next);
                if (next) emitOnboardingEvent("create-menu-opened");
              }}
              title={t("addressBar.create")}
              aria-label={t("addressBar.create")}
            >
              <Plus className="w-5 h-5" />
            </Button>
            {plusMenuMounted && (
              <div
                data-tour="create-menu"
                aria-hidden={!isPlusMenuOpen}
                inert={!isPlusMenuOpen}
                className={`absolute right-0 top-full mt-3 w-64 bg-m3-card border border-m3-border rounded-xl shadow-lg z-50 p-2 space-y-1 [--hosanna-origin:top_right] ${isPlusMenuOpen ? "hosanna-surface-enter" : "hosanna-surface-exit"}`}
              >
                <div className="px-4 py-2 text-label">{t("addressBar.createNew")}</div>
                <Can permission="song.create">
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenModal("create-song");
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 min-h-10 text-xs font-medium text-m3-text hover:bg-m3-hover rounded-md transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    {t("addressBar.newSong")}
                  </button>
                </Can>
                <Can permission="song.import">
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenModal("cifra-import");
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 min-h-10 text-xs font-medium text-m3-text hover:bg-m3-hover rounded-md transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                      <Music2 className="w-4 h-4" />
                    </div>
                    {t("addressBar.importSongs")}
                  </button>
                </Can>
                <Can permission="service.create">
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenModal("create-service");
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 min-h-10 text-xs font-medium text-m3-text hover:bg-m3-hover rounded-md transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    {t("addressBar.newService")}
                  </button>
                </Can>
                <Can permission="folder.create">
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenModal("create-folder");
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 min-h-10 text-xs font-medium text-m3-text hover:bg-m3-hover rounded-md transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                      <FolderPlus className="w-4 h-4" />
                    </div>
                    {t("addressBar.newFolder")}
                  </button>
                </Can>
                <Can permission="collection.create">
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenModal("create-collection");
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 min-h-10 text-xs font-medium text-m3-text hover:bg-m3-hover rounded-md transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                      <LibraryBig className="w-4 h-4" />
                    </div>
                    {t("addressBar.newCollection")}
                  </button>
                </Can>
                <Can permission="agenda.create">
                  <button
                    onClick={() => {
                      setIsPlusMenuOpen(false);
                      onOpenModal("create-event");
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 min-h-10 text-xs font-medium text-m3-text hover:bg-m3-hover rounded-md transition-colors cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
                      <CalendarPlus className="w-4 h-4" />
                    </div>
                    {t("agenda.newEvent")}
                  </button>
                </Can>
              </div>
            )}
          </div>
        </CanAny>
      </div>
    </>
  );

  return (
    <SharedWorkspaceAddressBar
      breadcrumbs={breadcrumbs}
      breadcrumbLabel={t("sidebar.mainMenu")}
      mobileMenuLabel={t("sidebar.mainMenu")}
      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      backLabel={
        view === "explorer"
          ? currentFolderId === null
            ? t("addressBar.atRootLevel")
            : currentFolder?.parentId
              ? t("addressBar.upOneLevel")
              : t("addressBar.upToRoot")
          : t("addressBar.back")
      }
      backDisabled={isDriveRoot}
      onBack={onNavigateBack}
      search={
        searchEnabled
          ? {
              value: searchQuery,
              placeholder: searchPlaceholder,
              label: searchPlaceholder,
              clearLabel: t("addressBar.clearSearch"),
              onChange: onSearchChange,
              tourId: "toolbar-search",
            }
          : undefined
      }
      context={context}
      actions={actions}
    />
  );
};
