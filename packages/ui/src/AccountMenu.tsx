/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Google-style account menu: avatar trigger, profile block, optional org
 * switcher, theme / language slots, links, custom sections, sign out.
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
  /** Host-rendered blocks after links (e.g. Studio Configurations / Analysis). */
  sections?: ReactNode | ((close: () => void) => ReactNode);
  className?: string;
  /** Use an <a> for links (auth) vs host Link — pass renderLink to customize. */
  renderLink?: (link: AccountMenuLink, className: string, onNavigate: () => void) => ReactNode;
  /** `popover` = circular avatar (Auth). `extended` = sidebar footer row (Studio). */
  variant?: "popover" | "extended";
  /** Extended rail: hide name/subtitle on the trigger. */
  collapsed?: boolean;
  /** Controlled open state (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Extended trigger subtitle (e.g. role label). */
  triggerSubtitle?: string;
  /** Extended trigger test id (Studio e2e). */
  triggerTestId?: string;
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
  sections,
  className,
  renderLink,
  variant = "popover",
  collapsed = false,
  open: openControlled,
  onOpenChange,
  triggerSubtitle,
  triggerTestId,
}) => {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const isControlled = openControlled !== undefined;
  const open = isControlled ? openControlled : openUncontrolled;
  const setOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(open) : next;
    if (!isControlled) setOpenUncontrolled(value);
    onOpenChange?.(value);
  };

  const openLabel = labels?.openMenu ?? "Account menu";
  const accountLabel = labels?.account ?? "Account";
  const signOutLabel = labels?.signOut ?? "Sign out";
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

  const close = () => setOpen(false);

  const linkClass =
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-m3-text transition-colors hover:bg-m3-hover";

  const panelBody = (
    <>
      <div className="flex items-center gap-3 border-b border-m3-border/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-snug tracking-tight text-m3-text">
            {user?.name || user?.email || accountLabel}
          </p>
          {user?.name && user?.email ? (
            <p className="mt-0.5 truncate text-[13px] leading-snug text-m3-secondary">{user.email}</p>
          ) : null}
        </div>
        {onSignOut ? (
          <button
            type="button"
            role="menuitem"
            title={signOutLabel}
            aria-label={signOutLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg text-m3-danger transition-colors hover:bg-m3-danger/10"
            onClick={() => {
              close();
              void onSignOut();
            }}
          >
            <LogOut className="h-4.5 w-4.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {organization || organizations.length > 0 ? (
        <div className="border-b border-m3-border/60 px-2 py-1">
          <button
            type="button"
            role="menuitem"
            aria-expanded={orgOpen}
            disabled={!canSwitchOrg}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors",
              canSwitchOrg ? "hover:bg-m3-hover cursor-pointer" : "cursor-default",
            )}
            onClick={() => canSwitchOrg && setOrgOpen((v) => !v)}
          >
            <OrgAvatar org={organization ?? null} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-m3-text">
                {organization?.name || "—"}
              </span>
              {organization?.slug ? (
                <span className="block truncate text-[12px] text-m3-secondary">
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
              className="mt-0.5 space-y-0.5 rounded-xl bg-m3-sidebar/50 p-1"
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

      {(() => {
        const sectionNodes = typeof sections === "function" ? sections(close) : sections;
        if (!links.length && !sectionNodes) return null;
        return (
          <div className="p-1.5">
            {links.map((link) => {
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
            {sectionNodes}
          </div>
        );
      })()}
    </>
  );

  if (variant === "extended") {
    const displayName = user?.name || user?.email || accountLabel;
    return (
      <div ref={rootRef} className={cn("relative shrink-0", className)}>
        <button
          type="button"
          data-testid={triggerTestId}
          aria-label={openLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={panelId}
          title={collapsed ? displayName : undefined}
          className="flex w-full min-h-10 cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-m3-hover"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white shadow-sm",
                !user?.image && "bg-linear-to-br from-sky-500 to-indigo-600",
              )}
            >
              {user?.image ? (
                <img src={user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(user)
              )}
            </span>
            <span
              className={cn(
                "flex min-w-0 flex-col text-left transition-[opacity,max-width,transform] duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                collapsed
                  ? "pointer-events-none max-w-0 -translate-x-2 opacity-0"
                  : "max-w-35 translate-x-0 opacity-100",
              )}
            >
              <span className="truncate text-xs font-medium text-m3-text">{displayName}</span>
              {triggerSubtitle ? (
                <span className="truncate text-caption text-m3-secondary">{triggerSubtitle}</span>
              ) : null}
            </span>
          </div>
        </button>

        {open ? (
          <div
            id={panelId}
            role="menu"
            className="absolute bottom-full left-0 z-50 mb-2 w-[min(100vw-1.5rem,20rem)] overflow-visible rounded-2xl border border-m3-border/70 bg-m3-card shadow-[0_12px_40px_-12px_rgb(0_0_0_/0.35)] animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            {panelBody}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        data-testid={triggerTestId}
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
          {panelBody}
        </div>
      ) : null}
    </div>
  );
};
