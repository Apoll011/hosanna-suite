/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Google-style waffle App Switcher: grid button opens a popover with
 * “Hello {name}” and the suite app catalog.
 */

"use client";

import { LayoutGrid } from "lucide-react";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "./cn";

export type AppSwitcherApp = {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  logoUrl: string;
  homeUrl: string | null;
  status: "live" | "coming_soon" | string;
  accessible?: boolean;
  accent?: string;
};

export type AppSwitcherLabels = {
  openMenu?: string;
  greeting?: string;
  comingSoon?: string;
  loading?: string;
  empty?: string;
  error?: string;
};

export type AppSwitcherProps = {
  /** Shown in the popover greeting (“Hello {displayName}”). */
  displayName: string;
  /** Preloaded apps — skips fetch when provided. */
  apps?: AppSwitcherApp[];
  /** Credentialed catalog URL (default `/api/suite/apps`). Ignored when `apps` is set. */
  appsUrl?: string;
  labels?: AppSwitcherLabels;
  className?: string;
  /** Highlight the app the host is currently in (muted / non-navigating). */
  currentAppId?: string;
};

type CatalogResponse = { apps?: AppSwitcherApp[] };

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
  labels,
  className,
  currentAppId,
}) => {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [apps, setApps] = useState<AppSwitcherApp[]>(appsProp ?? []);
  const [loading, setLoading] = useState(!appsProp);
  const [error, setError] = useState<string | null>(null);

  const openLabel = labels?.openMenu ?? "Open app switcher";
  const greetingTemplate = labels?.greeting ?? "Hello {name}";
  const comingSoonLabel = labels?.comingSoon ?? "Coming soon";
  const loadingLabel = labels?.loading ?? "Loading apps…";
  const emptyLabel = labels?.empty ?? "No apps available.";
  const errorLabel = labels?.error ?? "Could not load apps.";

  const greeting = greetingTemplate.replace(
    "{name}",
    firstName(displayName) || displayName || "there",
  );

  const loadApps = useCallback(async () => {
    if (appsProp) {
      setApps(appsProp);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(appsUrl, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CatalogResponse;
      setApps(Array.isArray(data.apps) ? data.apps : []);
    } catch {
      setError(errorLabel);
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [appsProp, appsUrl, errorLabel]);

  useEffect(() => {
    if (appsProp) {
      setApps(appsProp);
      setLoading(false);
      setError(null);
      return;
    }
    void loadApps();
  }, [appsProp, loadApps]);

  useEffect(() => {
    if (!open) return;
    if (!appsProp) void loadApps();
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
  }, [open, appsProp, loadApps]);

  const onSelect = (app: AppSwitcherApp) => {
    if (!isOpenable(app) || !app.homeUrl) return;
    if (currentAppId && app.id === currentAppId) {
      setOpen(false);
      return;
    }
    setOpen(false);
    window.location.assign(app.homeUrl);
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
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-2xl border border-m3-border/70 bg-m3-card shadow-lg"
        >
          <div className="border-b border-m3-border/60 px-4 py-3">
            <p className="text-sm font-semibold tracking-tight text-m3-text">{greeting}</p>
          </div>

          <div className="max-h-[min(70vh,22rem)] overflow-y-auto p-3">
            {loading ? (
              <p className="px-2 py-6 text-center text-sm text-m3-secondary">{loadingLabel}</p>
            ) : error ? (
              <p className="px-2 py-6 text-center text-sm text-m3-danger">{error}</p>
            ) : apps.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-m3-secondary">{emptyLabel}</p>
            ) : (
              <ul className="grid grid-cols-3 gap-1">
                {apps.map((app) => {
                  const openable = isOpenable(app);
                  const isCurrent = currentAppId === app.id;
                  return (
                    <li key={app.id}>
                      <button
                        type="button"
                        disabled={!openable}
                        title={
                          openable
                            ? app.name
                            : `${app.name} — ${comingSoonLabel}`
                        }
                        onClick={() => onSelect(app)}
                        className={cn(
                          "flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center transition-colors",
                          openable
                            ? "hover:bg-m3-hover cursor-pointer"
                            : "cursor-not-allowed opacity-55",
                          isCurrent && "bg-m3-hover/80",
                        )}
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-m3-border/50 bg-m3-sidebar/80"
                          style={
                            app.accent
                              ? { backgroundColor: `${app.accent}22`, borderColor: `${app.accent}44` }
                              : undefined
                          }
                        >
                          <img
                            src={app.logoUrl}
                            alt=""
                            className="h-6 w-6 object-contain"
                          />
                        </span>
                        <span className="line-clamp-2 w-full text-[11px] font-medium leading-tight text-m3-text">
                          {app.shortName || app.name}
                        </span>
                        {app.status === "coming_soon" ? (
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-m3-secondary">
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
