/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AccountMenu,
  AccountMenuDivider,
  Button,
  Badge,
  useCan,
  AnyRoleGate,
  Can,
} from "@hosanna/ui";
import { navigateToAuthAccount, prefetchAuthAccount } from "@/src/lib/authUrl";
import { useI18n } from "@/src/lib/i18n";
import { posthog } from "@/src/lib/posthog";
import { Folder } from "@/src/types";
import { Organization } from "better-auth/client";
import {
  BarChart3,
  Building2,
  Calendar1,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Church,
  HardDrive,
  LibraryBig,
  Music,
  Settings,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
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
  /** Organizations the user belongs to; enables the workspace switcher when > 1. */
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
  user?: {
    name: string;
    email?: string;
    image?: unknown;
    role?: string;
  } | null;
  onSelectFolder: (id: string | null) => void;
  onContextMenu: (e: React.MouseEvent, type: "folder" | "song", item: Folder) => void;
  toggleExpand: (id: string) => void;
  navigate: (path: string) => void;
  logout: () => void;
}

const NAV_ACTIVE = "bg-m3-primary/10 text-m3-primary";
const NAV_INACTIVE = "text-m3-secondary hover:bg-m3-hover hover:text-m3-text";
const NAV_BASE =
  "w-full flex items-center justify-between px-3 py-2 min-h-10 text-[13px] font-medium rounded-md transition-colors cursor-pointer group";

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
  const { t } = useI18n();
  const { darkMode, toggleDarkMode } = useTheme();
  const { granted: canViewLibraryHealth } = useCan("library.health");
  const shortName = organization?.metadata?.shortName || "";
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const hasMultipleOrgs = (organizations?.length ?? 0) > 1;

  const teams_enabled = posthog.isFeatureEnabled("teams-enabled") || false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setIsOrgMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const collapseText = (extra = "") =>
    `truncate transition-[opacity,max-width,transform] duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
      isSidebarCollapsed
        ? "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
        : "opacity-100 max-w-35 translate-x-0"
    } ${extra}`;

  const collapseBadge = () =>
    `transition-[opacity,max-width] duration-300 ease-in-out overflow-hidden shrink-0 ${
      isSidebarCollapsed ? "opacity-0 max-w-0 pointer-events-none" : "opacity-100 max-w-15"
    }`;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-m3-text/40 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        data-tour="sidebar"
        className={`${
          isSidebarOpen ? "flex absolute inset-y-0 left-0 z-50 bg-m3-sidebar shadow-lg" : "hidden"
        } md:flex md:relative md:bg-m3-sidebar/30 ${
          isSidebarCollapsed ? "md:w-20" : "md:w-64"
        } w-72 border-r border-m3-border p-4 flex-col gap-1 select-none shrink-0 transition-[width] duration-300 ease-in-out z-30`}
        role="navigation"
      >
        <div
          className="relative flex items-center mb-4 mt-2 select-none"
          role="banner"
          ref={orgMenuRef}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => {
                if (!isSidebarCollapsed) return;
                setIsOrgMenuOpen(false);
                setIsSidebarCollapsed(false);
              }}
              disabled={!isSidebarCollapsed}
              title={isSidebarCollapsed ? t("sidebar.expand") : undefined}
              aria-label={isSidebarCollapsed ? t("sidebar.expand") : undefined}
              className={`w-11 h-11 rounded-md flex items-center justify-center border border-m3-border/50 bg-m3-card text-m3-secondary shadow-sm shrink-0 relative group transition-colors duration-200 ${
                isSidebarCollapsed
                  ? "cursor-pointer hover:bg-m3-hover hover:border-m3-border hover:text-m3-text"
                  : ""
              }`}
            >
              <img
                src="/favicon.png"
                alt="Hosanna Studio"
                className={`w-10 h-10 object-contain rounded-md transition-opacity duration-200 ${
                  isSidebarCollapsed ? "group-hover:opacity-0" : ""
                }`}
              />
              <ChevronRight
                className={`w-5 h-5 absolute inset-0 m-auto transition-opacity duration-200 pointer-events-none ${
                  isSidebarCollapsed ? "opacity-0 group-hover:opacity-100" : "opacity-0 hidden"
                }`}
              />
            </button>

            <div
              className={`flex flex-col items-start min-w-0 flex-1 transition-[opacity,max-width,transform] duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
                isSidebarCollapsed
                  ? "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
                  : "opacity-100 max-w-50 translate-x-0"
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <h1 className="font-display font-semibold text-title text-m3-text leading-none truncate">
                  Hosanna Studio
                </h1>
                <div className="flex items-center shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="hidden md:flex shrink-0 -mr-2 min-h-10 min-w-10"
                    title={t("sidebar.collapse")}
                    aria-label={t("sidebar.collapse")}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {organization && (
                <button
                  onClick={() => setIsOrgMenuOpen((v) => !v)}
                  title={
                    hasMultipleOrgs ? t("sidebar.switchWorkspace") : t("sidebar.manageOrganization")
                  }
                  aria-haspopup="menu"
                  aria-expanded={isOrgMenuOpen}
                  className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md text-caption text-m3-secondary transition-colors hover:text-m3-text cursor-pointer"
                >
                  <span className="truncate min-w-0">
                    {organization?.metadata?.shortName || organization.slug}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                      isOrgMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {organization && isOrgMenuOpen && (
            <div
              className={`absolute top-full mt-2 z-50 bg-m3-card border border-m3-border rounded-xl shadow-lg p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 ${
                isSidebarCollapsed ? "left-0 w-64" : "left-0 right-0"
              }`}
              role="menu"
            >
              {hasMultipleOrgs && (
                <p className="px-2.5 pt-1.5 pb-1 text-label">{t("sidebar.switchWorkspace")}</p>
              )}
              {hasMultipleOrgs &&
                organizations?.map((o) => {
                  const isActive = o.id === organization?.id;
                  return (
                    <button
                      key={o.id}
                      role="menuitem"
                      disabled={isActive}
                      onClick={() => {
                        setIsOrgMenuOpen(false);
                        if (onSwitchOrganization) {
                          void onSwitchOrganization(o);
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 min-h-10 rounded-md text-left transition-colors ${
                        isActive
                          ? "bg-m3-primary/10 text-m3-primary cursor-default"
                          : "text-m3-text hover:bg-m3-hover cursor-pointer"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-md shrink-0 overflow-hidden flex items-center justify-center bg-m3-primary/10 border border-m3-border/60 text-[11px] font-semibold text-m3-primary">
                        {o.logo ? (
                          <img src={o.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (o.name?.trim().charAt(0) || "·").toUpperCase()
                        )}
                      </div>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold truncate">{o.name}</span>
                        <span className="block text-caption truncate">@{o.slug}</span>
                      </span>
                      {isActive && <Check className="w-4 h-4 shrink-0 text-m3-primary" />}
                    </button>
                  );
                })}
              {hasMultipleOrgs && <div className="my-1 border-t border-m3-border" />}
              <button
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
                className="w-full flex items-center gap-2.5 px-2.5 py-2 min-h-10 rounded-md text-left text-m3-text hover:bg-m3-hover cursor-pointer transition-colors"
              >
                <Building2 className="w-4 h-4 text-m3-secondary shrink-0" />
                <span className="text-xs font-medium truncate">
                  {t("sidebar.manageOrganization")}
                </span>
              </button>
            </div>
          )}
        </div>

        <div
          className={`px-3 py-2 text-label transition-[opacity,max-height,transform] duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
            isSidebarCollapsed
              ? "opacity-0 max-h-0 py-0 -translate-x-2 pointer-events-none"
              : "opacity-100 max-h-8 translate-x-0"
          }`}
        >
          {t("sidebar.mainMenu")}
        </div>

        <button
          data-tour="nav-drive"
          onClick={() => {
            onSelectFolder(null);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          title={isSidebarCollapsed ? t("sidebar.drive", { name: shortName }) : undefined}
          className={`${NAV_BASE} ${view === "explorer" ? NAV_ACTIVE : NAV_INACTIVE}`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <HardDrive
                className={`w-4.5 h-4.5 ${
                  view === "explorer" ? "text-m3-primary" : "text-m3-secondary"
                }`}
              />
            </div>
            <span className={collapseText()}>{t("sidebar.drive", { name: shortName })}</span>
          </div>
          <div className={collapseBadge()}>
            <Badge variant={view === "explorer" ? "accent" : "neutral"}>
              {rootSongsCount + rootFoldersCount}
            </Badge>
          </div>
        </button>

        <button
          data-tour="nav-library"
          onClick={() => {
            navigate(`${slugPrefix}/songs`);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          title={isSidebarCollapsed ? t("common.library") : undefined}
          className={`${NAV_BASE} ${view === "songs" ? NAV_ACTIVE : NAV_INACTIVE}`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Music
                className={`w-4.5 h-4.5 ${
                  view === "songs" ? "text-m3-primary" : "text-m3-secondary"
                }`}
              />
            </div>
            <span className={collapseText()}>{t("common.library")}</span>
          </div>
          <div className={collapseBadge()}>
            <Badge variant={view === "songs" ? "accent" : "neutral"}>{totalSongs}</Badge>
          </div>
        </button>

        <Can permission="collection.access">
          <button
            data-tour="nav-collections"
            onClick={() => {
              navigate(`${slugPrefix}/collections`);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            title={isSidebarCollapsed ? "Coleções" : undefined}
            className={`${NAV_BASE} ${
              view === "collections" || view === "collection-detail" ? NAV_ACTIVE : NAV_INACTIVE
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <LibraryBig
                  className={`w-4.5 h-4.5 ${
                    view === "collections" || view === "collection-detail"
                      ? "text-m3-primary"
                      : "text-m3-secondary"
                  }`}
                />
              </div>
              <span className={collapseText()}>{t("common.collections")}</span>
            </div>
            <div className={collapseBadge()}>
              <Badge
                variant={
                  view === "collections" || view === "collection-detail" ? "accent" : "neutral"
                }
              >
                {totalCollections}
              </Badge>
            </div>
          </button>
        </Can>

        <button
          data-tour="nav-services"
          onClick={() => {
            navigate(`${slugPrefix}/services`);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          title={isSidebarCollapsed ? t("common.services") : undefined}
          className={`${NAV_BASE} ${view === "services" || view === "service-editor" ? NAV_ACTIVE : NAV_INACTIVE}`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Church
                className={`w-4.5 h-4.5 ${
                  view === "services" || view === "service-editor"
                    ? "text-m3-primary"
                    : "text-m3-secondary"
                }`}
              />
            </div>
            <span className={collapseText()}>{t("common.services")}</span>
          </div>
          <div className={collapseBadge()}>
            <Badge
              variant={view === "services" || view === "service-editor" ? "accent" : "neutral"}
            >
              {totalServices}
            </Badge>
          </div>
        </button>

        {teams_enabled && (
          <button
            onClick={() => {
              navigate(`${slugPrefix}/teams`);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            title={isSidebarCollapsed ? t("common.teams") : undefined}
            className={`${NAV_BASE} ${view === "teams" ? NAV_ACTIVE : NAV_INACTIVE}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Users
                  className={`w-4.5 h-4.5 ${
                    view === "teams" ? "text-m3-primary" : "text-m3-secondary"
                  }`}
                />
              </div>
              <span className={collapseText()}>{t("common.teams")}</span>
            </div>
          </button>
        )}

        <Can permission="agenda.access">
          <button
            data-tour="nav-agenda"
            onClick={() => {
              navigate(`${slugPrefix}/agenda`);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            title={isSidebarCollapsed ? t("common.agenda") : undefined}
            className={`${NAV_BASE} ${view === "agenda" ? NAV_ACTIVE : NAV_INACTIVE}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Calendar1
                  className={`w-4.5 h-4.5 ${
                    view === "agenda" ? "text-m3-primary" : "text-m3-secondary"
                  }`}
                />
              </div>
              <span className={collapseText()}>{t("common.agenda")}</span>
            </div>
            <div className={collapseBadge()}>
              <Badge variant={view === "agenda" ? "accent" : "neutral"}>{eventCount}</Badge>
            </div>
          </button>
        </Can>

        {showFolderTree && (
          <div
            className={`flex-1 flex flex-col min-h-0 transition-[opacity,max-height] duration-300 ease-in-out overflow-hidden ${
              isSidebarCollapsed
                ? "opacity-0 max-h-0 pointer-events-none"
                : "opacity-100 max-h-full"
            }`}
          >
            <div className="mt-6 px-3 py-2 text-label shrink-0 whitespace-nowrap">
              {t("sidebar.foldersCount", { count: allFolders.length })}
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
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
        )}

        {(!showFolderTree || isSidebarCollapsed) && <div className="flex-1" />}

        <AnyRoleGate roles={["owner", "admin"]}>
          <button
            onClick={() => {
              navigate(`${slugPrefix}/trash`);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            title={isSidebarCollapsed ? t("sidebar.trash") : undefined}
            className={`${NAV_BASE} ${view === "trash" ? NAV_ACTIVE : NAV_INACTIVE}`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Trash2
                  className={`w-4.5 h-4.5 ${
                    view === "trash" ? "text-m3-primary" : "text-m3-secondary"
                  }`}
                />
              </div>
              <span className={collapseText()}>{t("sidebar.trash")}</span>
            </div>
            <div className={collapseBadge()}>
              <Badge variant={view === "trash" ? "accent" : "neutral"}>{trashCount}</Badge>
            </div>
          </button>
        </AnyRoleGate>

        {user && (
          <div
            data-testid="nav-user-menu"
            className="mt-2 shrink-0 border-t border-m3-border pt-2"
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
              organizations={(organizations ?? []).map((o) => ({
                id: o.id,
                name: o.name,
                slug: o.slug,
                logo: o.logo ?? null,
              }))}
              onSwitchOrganization={(org) => {
                const match = organizations?.find((o) => o.id === org.id);
                if (match && onSwitchOrganization) void onSwitchOrganization(match);
              }}
              onSignOut={logout}
              labels={{
                openMenu: t("sidebar.accountMenu"),
                account: t("sidebar.openAccount"),
                signOut: t("sidebar.logout"),
                switchOrganization: t("sidebar.switchWorkspace"),
                theme: t("sidebar.theme"),
                language: t("sidebar.language"),
              }}
              hide={{ language: true }}
              theme={{ darkMode, onToggle: toggleDarkMode }}
              links={[
                {
                  href: "#account",
                  label: t("sidebar.openAccount"),
                  icon: <UserRound className="h-4 w-4 text-m3-secondary" aria-hidden />,
                },
                {
                  href: "#organization",
                  label: t("sidebar.manageOrganization"),
                  icon: <Building2 className="h-4 w-4 text-m3-secondary" aria-hidden />,
                },
              ]}
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
                        link.href === "#organization"
                          ? "/account/organization/profile"
                          : undefined,
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
                      navigate(`${slugPrefix}/settings`);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 text-m3-secondary" aria-hidden />
                    {t("sidebar.openSettings")}
                  </button>
                  {canViewLibraryHealth ? (
                    <>
                      <AccountMenuDivider />
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-m3-text transition-colors hover:bg-m3-hover"
                        onClick={() => {
                          close();
                          navigate(`${slugPrefix}/analytics`);
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                      >
                        <BarChart3 className="h-4 w-4 text-m3-secondary" aria-hidden />
                        {t("sidebar.openAnalytics")}
                      </button>
                    </>
                  ) : null}
                </>
              )}
            />
          </div>
        )}
      </aside>
    </>
  );
};
