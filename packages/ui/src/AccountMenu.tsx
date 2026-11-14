/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Google-style account menu: avatar trigger, profile block, optional org
 * switcher, theme / language slots, links, sign out.
 */

"use client";

import { Building2, Check, ChevronDown, LogOut, UserRound } from "lucide-react";
import React, { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "./cn";

export type AccountMenuUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type AccountMenuOrg = {
  id: string;
  name: string;
  slug?: string | null;
  logo?: string | null;
};

export type AccountMenuLink = {
  href: string;
  label: string;
  icon?: ReactNode;
};

export type AccountMenuLabels = {
  openMenu?: string;
  account?: string;
  signOut?: string;
  organization?: string;
  switchOrganization?: string;
  theme?: string;
  language?: string;
};

export type AccountMenuProps = {
  user: AccountMenuUser | null | undefined;
  labels?: AccountMenuLabels;
  /** Primary profile / account center link. */
  links?: AccountMenuLink[];
  onSignOut?: () => void | Promise<void>;
  /** Current org + list; when `organizations.length > 1`, expand to switch. */
  organization?: AccountMenuOrg | null;
  organizations?: AccountMenuOrg[];
  onSwitchOrganization?: (org: AccountMenuOrg) => void | Promise<void>;
  /** Host-rendered theme control (toggle button or row). */
  themeControl?: ReactNode;
  /** Host-rendered language control. */
  languageControl?: ReactNode;
  className?: string;
  /** Use an <a> for links (auth) vs host Link — pass renderLink to customize. */
  renderLink?: (link: AccountMenuLink, className: string, onNavigate: () => void) => ReactNode;
};

function initials(user: AccountMenuUser | null | undefined): string {
  const fromName = user?.name?.trim()?.charAt(0);
  const fromEmail = user?.email?.trim()?.charAt(0);
  return (fromName || fromEmail || "?").toUpperCase();
}

function OrgAvatar({ org, size = "md" }: { org: AccountMenuOrg | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs";
  return (
    <div
      className={cn(
        dim,
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-m3-border/60 bg-m3-primary/10 font-semibold text-m3-primary",
      )}
    >
      {org?.logo ? (
        <img src={org.logo} alt="" className="h-full w-full object-cover" />
      ) : org?.name ? (
        (org.name.trim().charAt(0) || "·").toUpperCase()
      ) : (
        <Building2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
    </div>
  );
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  user,
  labels,
  links = [],
  onSignOut,
  organization,
  organizations = [],
  onSwitchOrganization,
  themeControl,
  languageControl,
  className,
  renderLink,
}) => {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const openLabel = labels?.openMenu ?? "Account menu";
  const accountLabel = labels?.account ?? "Account";
  const signOutLabel = labels?.signOut ?? "Sign out";
  const orgLabel = labels?.organization ?? "Organization";
  const switchOrgLabel = labels?.switchOrganization ?? "Switch organization";

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

  useEffect(() => {
    if (!open) setOrgOpen(false);
  }, [open]);

  const canSwitchOrg = organizations.length > 1 && Boolean(onSwitchOrganization);

  const onSelectOrg = async (org: AccountMenuOrg) => {
    if (!onSwitchOrganization || org.id === organization?.id || switchingId) return;
    setSwitchingId(org.id);
    try {
      await onSwitchOrganization(org);
      setOrgOpen(false);
    } finally {
      setSwitchingId(null);
    }
  };

  const linkClass =
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-m3-text transition-colors hover:bg-m3-hover";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="group inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m3-primary"
        aria-label={openLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-[11px] font-bold leading-none text-white shadow-sm ring-2 ring-transparent transition-[box-shadow,ring] group-hover:ring-m3-primary/35",
            open && "ring-m3-primary/50",
            !user?.image && "bg-linear-to-br from-sky-500 to-indigo-600",
          )}
        >
          {user?.image ? (
            <img src={user.image} alt="" className="block h-full w-full object-cover" />
          ) : (
            initials(user)
          )}
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,20rem)] overflow-visible rounded-2xl border border-m3-border/70 bg-m3-card shadow-[0_12px_40px_-12px_rgb(0_0_0_/0.35)]"
        >
          <div className="border-b border-m3-border/60 px-4 py-3.5">
            <p className="truncate text-sm font-semibold tracking-tight text-m3-text">
              {user?.name || user?.email || accountLabel}
            </p>
            {user?.name && user?.email ? (
              <p className="mt-0.5 truncate text-xs text-m3-secondary">{user.email}</p>
            ) : null}
          </div>

          {organization || organizations.length > 0 ? (
            <div className="border-b border-m3-border/60 p-2">
              <button
                type="button"
                role="menuitem"
                aria-expanded={orgOpen}
                disabled={!canSwitchOrg}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                  canSwitchOrg ? "hover:bg-m3-hover cursor-pointer" : "cursor-default",
                )}
                onClick={() => canSwitchOrg && setOrgOpen((v) => !v)}
              >
                <OrgAvatar org={organization ?? null} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-m3-secondary">
                    {orgLabel}
                  </span>
                  <span className="block truncate text-sm font-semibold text-m3-text">
                    {organization?.name || "—"}
                  </span>
                  {organization?.slug ? (
                    <span className="block truncate text-[11px] text-m3-secondary">
                      @{organization.slug}
                    </span>
                  ) : null}
                </span>
                {canSwitchOrg ? (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-m3-secondary transition-transform",
                      orgOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                ) : null}
              </button>

              {orgOpen && canSwitchOrg ? (
                <div
                  className="mt-1 space-y-0.5 rounded-xl bg-m3-sidebar/50 p-1"
                  role="group"
                  aria-label={switchOrgLabel}
                >
                  {organizations.map((org) => {
                    const active = org.id === organization?.id;
                    return (
                      <button
                        key={org.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        disabled={Boolean(switchingId)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                          active
                            ? "bg-m3-primary/10 text-m3-primary"
                            : "hover:bg-m3-hover text-m3-text",
                        )}
                        onClick={() => void onSelectOrg(org)}
                      >
                        <OrgAvatar org={org} size="sm" />
                        <span className="min-w-0 flex-1 truncate font-medium">{org.name}</span>
                        {active ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {(themeControl || languageControl) && (
            <div className="space-y-0.5 border-b border-m3-border/60 px-2 py-1.5">
              {themeControl}
              {languageControl}
            </div>
          )}

          <div className="p-1.5">
            {links.map((link) => {
              const close = () => setOpen(false);
              if (renderLink) {
                return (
                  <React.Fragment key={link.href + link.label}>
                    {renderLink(link, linkClass, close)}
                  </React.Fragment>
                );
              }
              return (
                <a
                  key={link.href + link.label}
                  href={link.href}
                  role="menuitem"
                  className={linkClass}
                  onClick={close}
                >
                  {link.icon ?? <UserRound className="h-4 w-4 text-m3-secondary" aria-hidden />}
                  {link.label}
                </a>
              );
            })}

            {onSignOut ? (
              <button
                type="button"
                role="menuitem"
                className={cn(linkClass, "w-full text-left")}
                onClick={() => {
                  setOpen(false);
                  void onSignOut();
                }}
              >
                <LogOut className="h-4 w-4 text-m3-secondary" aria-hidden />
                {signOutLabel}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
