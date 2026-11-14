/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Google-style waffle App Switcher: grid button opens a popover with
 * greeting, suite catalog, and a link back to the auth home hub.
 */

"use client";

import { Home, LayoutGrid } from "lucide-react";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "./cn";
import { SuiteAppIcon } from "./SuiteAppIcon";
import { loadSuiteApps, peekSuiteAppsCache, type SuiteCatalogApp } from "./suiteAppsCache";
import { localizeSuiteApps } from "./suiteLabels";

export type AppSwitcherApp = SuiteCatalogApp;

export type AppSwitcherLabels = {
  openMenu?: string;
  greeting?: string;
  comingSoon?: string;
  loading?: string;
  empty?: string;
  error?: string;
  /** Link to auth `/home` hub. */
  goHome?: string;
};

export type AppSwitcherProps = {
  /** Shown in the popover greeting (“Hello {displayName}”). */
  displayName: string;
  /** Preloaded apps — skips fetch when provided. */
  apps?: AppSwitcherApp[];
  /** Credentialed catalog URL (default `/api/suite/apps`). Ignored when `apps` is set. */
  appsUrl?: string;
  /** Absolute or same-origin URL for the suite home hub. */
  homeHubUrl?: string;
  labels?: AppSwitcherLabels;
  /** Host translator — localizes catalog name/description keys when present. */
  translate?: (key: string) => string;
  className?: string;
  /** Highlight the app the host is currently in (muted / non-navigating). */
  currentAppId?: string;
};

function firstName(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function isOpenable(app: AppSwitcherApp): boolean {
  if (app.status === "coming_soon") return false;
  if (app.accessible === false) return false;
  return Boolean(app.homeUrl);
}

export const AppSwitcher: React.FC<AppSwitcherProps> = ({
  displayName,
  apps: appsProp,
  appsUrl = "/api/suite/apps",
  homeHubUrl,
  labels,
  translate,
  className,
  currentAppId,
}) => {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const applyLocale = useCallback(
    (list: AppSwitcherApp[]) => (translate ? localizeSuiteApps(list, translate) : list),
    [translate],
  );

  const [apps, setApps] = useState<AppSwitcherApp[]>(() => {
    if (appsProp) return applyLocale(appsProp);
    const cached = peekSuiteAppsCache(appsUrl);
    return cached ? applyLocale(cached) : [];
  });
  const [loading, setLoading] = useState(() => !appsProp && !peekSuiteAppsCache(appsUrl));
  const [error, setError] = useState<string | null>(null);

  const openLabel = labels?.openMenu ?? "Open app switcher";
  const greetingTemplate = labels?.greeting ?? "Hello {name}";
  const comingSoonLabel = labels?.comingSoon ?? "Coming soon";
  const loadingLabel = labels?.loading ?? "Loading apps…";
  const emptyLabel = labels?.empty ?? "No apps available.";
  const errorLabel = labels?.error ?? "Could not load apps.";
  const goHomeLabel = labels?.goHome ?? "Hosanna Home";

  const greeting = greetingTemplate.replace(
    "{name}",
    firstName(displayName) || displayName || "there",
  );

  const refresh = useCallback(async () => {
    if (appsProp) {
      setApps(applyLocale(appsProp));
      setLoading(false);
      setError(null);
      return;
    }
    const cached = peekSuiteAppsCache(appsUrl);
    if (cached?.length) {
      setApps(applyLocale(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const list = await loadSuiteApps(appsUrl);
      setApps(applyLocale(list));
      setError(null);
    } catch {
      if (!peekSuiteAppsCache(appsUrl)?.length) {
        setError(errorLabel);
        setApps([]);
      }
    } finally {
      setLoading(false);
    }
  }, [appsProp, appsUrl, errorLabel, applyLocale]);

  useEffect(() => {
    if (appsProp) {
      setApps(applyLocale(appsProp));
      setLoading(false);
      setError(null);
      return;
    }
    void refresh();
  }, [appsProp, refresh, applyLocale]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onSelect = (app: AppSwitcherApp) => {
    if (!isOpenable(app) || !app.homeUrl) return;
    if (currentAppId && app.id === currentAppId) {
      setOpen(false);
      return;
    }
    setOpen(false);
    window.location.assign(app.homeUrl);
  };

  const goHome = () => {
    if (!homeHubUrl) return;
    setOpen(false);
    window.location.assign(homeHubUrl);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-m3-secondary transition-colors hover:bg-m3-hover hover:text-m3-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m3-primary"
        aria-label={openLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <LayoutGrid className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={openLabel}
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-m3-border/70 bg-m3-card shadow-[0_16px_48px_-16px_rgb(0_0_0_/0.4)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-m3-border/60 px-4 py-3">
            <p className="text-sm font-semibold tracking-tight text-m3-text">{greeting}</p>
            {homeHubUrl ? (
              <button
                type="button"
                onClick={goHome}
                className="inline-flex items-center gap-1.5 rounded-full bg-m3-sidebar/80 px-2.5 py-1 text-[11px] font-semibold text-m3-primary transition-colors hover:bg-m3-hover"
              >
                <Home className="h-3.5 w-3.5" aria-hidden />
                {goHomeLabel}
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto p-3">
            {loading && apps.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-m3-secondary">{loadingLabel}</p>
            ) : error && apps.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-m3-danger">{error}</p>
            ) : apps.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-m3-secondary">{emptyLabel}</p>
            ) : (
              <ul className="grid grid-cols-3 gap-1.5">
                {apps.map((app) => {
                  const openable = isOpenable(app);
                  const isCurrent = currentAppId === app.id;
                  return (
                    <li key={app.id}>
                      <button
                        type="button"
                        disabled={!openable}
                        title={openable ? app.name : `${app.name} — ${comingSoonLabel}`}
                        onClick={() => onSelect(app)}
                        className={cn(
                          "flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition-colors",
                          openable
                            ? "hover:bg-m3-hover cursor-pointer"
                            : "cursor-not-allowed opacity-55",
                          isCurrent && "bg-m3-hover/90 ring-1 ring-m3-primary/20",
                        )}
                      >
                        <SuiteAppIcon logoUrl={app.logoUrl} accent={app.accent} size="sm" />
                        <span className="line-clamp-2 w-full text-[11px] font-semibold leading-tight text-m3-text">
                          {app.shortName || app.name}
                        </span>
                        {app.status === "coming_soon" ? (
                          <span className="rounded-full bg-m3-sidebar px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-m3-secondary">
                            {comingSoonLabel}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
