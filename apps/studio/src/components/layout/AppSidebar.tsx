/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isDemoMode } from "@/src/demo";
import { navigateToAuthAccount, prefetchAuthAccount } from "@/src/lib/authUrl";
import { useI18n } from "@/src/lib/i18n";
import { Folder } from "@/src/types";
import { Organization } from "better-auth/client";
import {
  AccountMenu,
  AnyRoleGate,
  Badge,
  Can,
  WorkspaceNavItem,
  WorkspaceSidebar,
  useCan,
  usePresence,
  type WorkspaceSidebarItem,
} from "@hosanna/ui";
import {
  BarChart3,
  Building2,
  Calendar1,
  Check,
  ChevronDown,
  Church,
  HardDrive,
  LibraryBig,
  Music,
  Settings,
  Trash2,
  UserRound,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import type { Organization as AuthOrganization } from "../../contexts/AuthContext";
import { ViewName } from "../../layouts/view";
import { getRoleLabel } from "../../utils/settingsUtils";
import { FolderTreeItemNode, FolderTreeNode } from "../explorer";

interface AppSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  organization?: Organization | null;
  organizations?: AuthOrganization[];
  onSwitchOrganization?: (org: AuthOrganization) => void;
  slugPrefix: string;
  view: ViewName;
  currentFolderId: string | null;
  rootSongsCount: number;
  rootFoldersCount: number;
  totalSongs: number;
  totalServices: number;
  totalCollections: number;
  trashCount: number;
  eventCount: number;
  allFolders: Folder[];
  folderTree: FolderTreeNode[];
  expandedFolderIds: Set<string>;
  showFolderTree: boolean;
  user?: { name: string; email?: string; image?: unknown; role?: string } | null;
  onSelectFolder: (id: string | null) => void;
  onContextMenu: (e: React.MouseEvent, type: "folder" | "song", item: Folder) => void;
  toggleExpand: (id: string) => void;
  navigate: (path: string) => void;
  logout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  organization,
  organizations,
  onSwitchOrganization,
  slugPrefix,
  view,
  currentFolderId,
  rootSongsCount,
  rootFoldersCount,
  totalSongs,
  totalServices,
  totalCollections,
  trashCount,
  eventCount,
  allFolders,
  folderTree,
  expandedFolderIds,
  showFolderTree,
  user,
  onSelectFolder,
  onContextMenu,
  toggleExpand,
  navigate,
  logout,
}) => {
  const { t, language } = useI18n();
  const { theme, setTheme } = useTheme();
  const { granted: canViewLibraryHealth } = useCan("library.health");
  const { granted: canAccessCollections } = useCan("collection.access");
  const { granted: canAccessAgenda } = useCan("agenda.access");
  const isDemo = isDemoMode();
  const shortName = organization?.metadata?.shortName || "";
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const orgMenuMounted = usePresence(isOrgMenuOpen);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const hasMultipleOrgs = (organizations?.length ?? 0) > 1;

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setIsOrgMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  const select = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const navItems = useMemo<WorkspaceSidebarItem[]>(() => {
    const items: WorkspaceSidebarItem[] = [
      {
        id: "drive",
        label: t("sidebar.drive", { name: shortName }),
        icon: <HardDrive className="h-4 w-4" />,
        active: view === "explorer",
        tourId: "nav-drive",
        badge: (
          <Badge variant={view === "explorer" ? "accent" : "neutral"}>
            {rootSongsCount + rootFoldersCount}
          </Badge>
        ),
        onSelect: () => onSelectFolder(null),
      },
      {
        id: "songs",
        label: t("common.library"),
        icon: <Music className="h-4 w-4" />,
        active: view === "songs",
        tourId: "nav-library",
        badge: <Badge variant={view === "songs" ? "accent" : "neutral"}>{totalSongs}</Badge>,
        onSelect: () => select(`${slugPrefix}/songs`),
      },
      ...(canAccessCollections
        ? [
            {
              id: "collections",
              label: t("common.collections"),
              icon: <LibraryBig className="h-4 w-4" />,
              active: view === "collections" || view === "collection-detail",
              tourId: "nav-collections",
              badge: (
                <Badge
                  variant={
                    view === "collections" || view === "collection-detail" ? "accent" : "neutral"
                  }
                >
                  {totalCollections}
                </Badge>
              ),
              onSelect: () => select(`${slugPrefix}/collections`),
            },
          ]
        : []),
      {
        id: "services",
        label: t("common.services"),
        icon: <Church className="h-4 w-4" />,
        active: view === "services" || view === "service-editor",
        tourId: "nav-services",
        badge: (
          <Badge variant={view === "services" || view === "service-editor" ? "accent" : "neutral"}>
            {totalServices}
          </Badge>
        ),
        onSelect: () => select(`${slugPrefix}/services`),
      },
      ...(canAccessAgenda
        ? [
            {
              id: "agenda",
              label: t("common.agenda"),
              icon: <Calendar1 className="h-4 w-4" />,
              active: view === "agenda",
              tourId: "nav-agenda",
              badge: <Badge variant={view === "agenda" ? "accent" : "neutral"}>{eventCount}</Badge>,
              onSelect: () => select(`${slugPrefix}/agenda`),
            },
          ]
        : []),
    ];
    return items;
  }, [
    canAccessAgenda,
    canAccessCollections,
    eventCount,
    onSelectFolder,
    rootFoldersCount,
    rootSongsCount,
    shortName,
    slugPrefix,
    t,
    totalCollections,
    totalServices,
    totalSongs,
    view,
  ]);

  const organizationContent = organization ? (
    <div className="relative min-w-0" ref={orgMenuRef}>
      <button
        type="button"
        onClick={() => setIsOrgMenuOpen((current) => !current)}
        title={hasMultipleOrgs ? t("sidebar.switchWorkspace") : t("sidebar.manageOrganization")}
        aria-haspopup="menu"
        aria-expanded={isOrgMenuOpen}
        className="inline-flex max-w-full min-w-0 cursor-pointer items-center gap-1 rounded-md text-caption text-m3-secondary transition-colors hover:text-m3-text"
      >
        <span className="min-w-0 truncate">
          {organization.metadata?.shortName || organization.slug}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${isOrgMenuOpen ? "rotate-180" : ""}`}
        />
      </button>
      {orgMenuMounted && (
        <div
          aria-hidden={!isOrgMenuOpen}
          inert={!isOrgMenuOpen}
          className={`absolute left-0 right-0 top-full z-50 mt-2 space-y-1 rounded-xl border border-m3-border bg-m3-card p-2 shadow-lg [--hosanna-origin:top_left] ${isOrgMenuOpen ? "hosanna-surface-enter" : "hosanna-surface-exit"}`}
          role="menu"
        >
          {hasMultipleOrgs && (
            <p className="px-2.5 pb-1 pt-1.5 text-label">{t("sidebar.switchWorkspace")}</p>
          )}
          {hasMultipleOrgs &&
            organizations?.map((org) => {
              const active = org.id === organization.id;
              return (
                <button
                  key={org.id}
                  type="button"
                  role="menuitem"
                  disabled={active}
                  onClick={() => {
                    setIsOrgMenuOpen(false);
                    if (onSwitchOrganization) void onSwitchOrganization(org);
                  }}
                  className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${active ? "cursor-default bg-m3-primary/10 text-m3-primary" : "text-m3-text hover:bg-m3-hover"}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-m3-border/60 bg-m3-primary/10 text-[11px] font-semibold text-m3-primary">
                    {org.logo ? (
                      <img src={org.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (org.name.trim().charAt(0) || "·").toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{org.name}</span>
                    <span className="block truncate text-caption">@{org.slug}</span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-m3-primary" />}
                </button>
              );
            })}
          {hasMultipleOrgs && <div className="my-1 border-t border-m3-border" />}
          <button
            type="button"
            role="menuitem"
            onMouseEnter={() => prefetchAuthAccount()}
            onFocus={() => prefetchAuthAccount()}
            onClick={() => {
              setIsOrgMenuOpen(false);
              navigateToAuthAccount({
                path: "/account/organization/profile",
                returnUrl: window.location.href,
              });
            }}
            className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-m3-text transition-colors hover:bg-m3-hover"
          >
            <Building2 className="h-4 w-4 shrink-0 text-m3-secondary" />
            <span className="truncate text-xs font-medium">{t("sidebar.manageOrganization")}</span>
          </button>
        </div>
      )}
    </div>
  ) : null;

  const folderContent = showFolderTree ? (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden transition-[opacity,max-height] duration-300 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] ${isSidebarCollapsed ? "pointer-events-none max-h-0 opacity-0" : "max-h-full opacity-100"}`}
    >
      <div className="mt-6 shrink-0 whitespace-nowrap px-3 py-2 text-label">
        {t("sidebar.foldersCount", { count: allFolders.length })}
      </div>
      <div className="custom-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {folderTree.map((node) => (
          <FolderTreeItemNode
            key={node.folder.id}
            node={node}
            currentFolderId={currentFolderId}
            onSelectFolder={(id) => {
              onSelectFolder(id);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            onContextMenu={onContextMenu}
            expandedFolderIds={expandedFolderIds}
            toggleExpand={toggleExpand}
          />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex-1" />
  );

  const footer = (
    <div className="mt-auto shrink-0">
      <AnyRoleGate roles={["owner", "admin"]}>
        <WorkspaceNavItem
          icon={<Trash2 className="h-4 w-4" />}
          label={t("sidebar.trash")}
          collapsed={isSidebarCollapsed}
          active={view === "trash"}
          badge={<Badge variant={view === "trash" ? "accent" : "neutral"}>{trashCount}</Badge>}
          onClick={() => select(`${slugPrefix}/trash`)}
        />
      </AnyRoleGate>
      {user && (
        <div
          data-tour="nav-user-menu"
          data-testid="nav-user-menu"
          className="mt-2 border-t border-m3-border pt-2"
        >
          <AccountMenu
            variant="extended"
            collapsed={isSidebarCollapsed}
            triggerSubtitle={getRoleLabel(user.role ?? "guest")}
            user={{
              name: user.name,
              email: user.email,
              image: typeof user.image === "string" ? user.image : null,
            }}
            organization={
              organization
                ? {
                    id: organization.id,
                    name: organization.name,
                    slug: organization.slug,
                    logo: organization.logo ?? null,
                  }
                : null
            }
            organizations={(organizations ?? []).map((org) => ({
              id: org.id,
              name: org.name,
              slug: org.slug,
              logo: org.logo ?? null,
            }))}
            onSwitchOrganization={(org) => {
              const match = organizations?.find((item) => item.id === org.id);
              if (match && onSwitchOrganization) void onSwitchOrganization(match);
            }}
            onSignOut={logout}
            language={language}
            hide={{ language: true, links: isDemo }}
            theme={{ value: theme, onChange: setTheme }}
            links={
              isDemo
                ? []
                : [
                    {
                      href: "#account",
                      label: t("suite.accountMenu.account"),
                      icon: <UserRound className="h-4 w-4 text-m3-secondary" aria-hidden />,
                    },
                    {
                      href: "#organization",
                      label: t("suite.accountMenu.organization"),
                      icon: <Building2 className="h-4 w-4 text-m3-secondary" aria-hidden />,
                    },
                  ]
            }
            renderLink={(link, className, onNavigate) => (
              <button
                key={link.href + link.label}
                type="button"
                role="menuitem"
                className={`${className} w-full cursor-pointer text-left`}
                onMouseEnter={() => prefetchAuthAccount()}
                onFocus={() => prefetchAuthAccount()}
                onClick={() => {
                  onNavigate();
                  navigateToAuthAccount({
                    path:
                      link.href === "#organization" ? "/account/organization/profile" : undefined,
                    returnUrl: window.location.href,
                  });
                }}
              >
                {link.icon}
                {link.label}
              </button>
            )}
            sections={(close) => (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-m3-text transition-colors hover:bg-m3-hover"
                  onClick={() => {
                    close();
                    select(`${slugPrefix}/settings`);
                  }}
                >
                  <Settings className="h-4 w-4 text-m3-secondary" aria-hidden />
                  {t("sidebar.openSettings")}
                </button>
                {canViewLibraryHealth && (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-m3-text transition-colors hover:bg-m3-hover"
                    onClick={() => {
                      close();
                      select(`${slugPrefix}/analytics`);
                    }}
                  >
                    <BarChart3 className="h-4 w-4 text-m3-secondary" aria-hidden />
                    {t("sidebar.openAnalytics")}
                  </button>
                )}
              </>
            )}
          />
        </div>
      )}
    </div>
  );

  return (
    <WorkspaceSidebar
      data-tour="sidebar"
      data-testid="sidebar"
      appName="Hosanna Studio"
      logo={<img src="/favicon.png" alt="" className="h-10 w-10 rounded-lg object-contain" />}
      logoAlt="Hosanna Studio"
      open={isSidebarOpen}
      collapsed={isSidebarCollapsed}
      onDismiss={() => setIsSidebarOpen(false)}
      onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      collapseLabel={t("sidebar.collapse")}
      expandLabel={t("sidebar.expand")}
      navigationLabel={t("sidebar.mainMenu")}
      navItems={navItems}
      headerContent={organizationContent}
      content={folderContent}
      footerContent={footer}
      language={language}
      role="complementary"
      aria-label={t("sidebar.mainMenu")}
    />
  );
};
