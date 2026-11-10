"use client";

import { useActiveOrganization, type OrgSummary } from "@/hooks/useActiveOrganization";
import { useI18n } from "@/lib/i18n";
import { Spinner } from "@hosanna/ui";
import { Building2, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function OrgAvatar({ org, size = "md" }: { org: OrgSummary | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs";
  return (
    <div
      className={`${dim} shrink-0 overflow-hidden rounded-md flex items-center justify-center bg-m3-primary/10 border border-m3-border/60 font-semibold text-m3-primary`}
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

/** Compact org picker for the account center nav / overview. */
export function OrgSwitcher({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const { organization, organizations, isLoading, switchOrganization } = useActiveOrganization();
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const onSelect = async (org: OrgSummary) => {
    if (org.id === organization?.id || switchingId) return;
    setSwitchingId(org.id);
    try {
      const ok = await switchOrganization(org);
      if (ok) setOpen(false);
    } finally {
      setSwitchingId(null);
    }
  };

  if (isLoading && !organization) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1.5 text-caption ${className}`}>
        <Spinner size="sm" />
        <span>{t("accountOrg.loading")}</span>
      </div>
    );
  }

  if (!organization && organizations.length === 0) {
    return (
      <div className={`px-2 py-1.5 text-caption ${className}`}>
        <p className="text-m3-secondary mb-1">{t("accountOrg.switcher.noOrgs")}</p>
        <Link href="/onboarding" className="text-xs font-semibold text-m3-primary hover:underline">
          {t("accountOrg.switcher.createOrg")}
        </Link>
      </div>
    );
  }

  const canSwitch = organizations.length > 1;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => canSwitch && setOpen((v) => !v)}
        disabled={!canSwitch}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("accountOrg.switcher.label")}
        className={`w-full flex items-center gap-2.5 rounded-lg border border-m3-border/70 bg-m3-sidebar/50 px-2.5 py-2 text-left transition-colors ${
          canSwitch
            ? "hover:bg-m3-hover cursor-pointer"
            : "cursor-default opacity-95"
        }`}
      >
        <OrgAvatar org={organization} />
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold text-m3-text truncate">
            {organization?.name || t("accountOrg.switcher.noOrgs")}
          </span>
          {organization?.slug ? (
            <span className="block text-caption text-m3-secondary truncate">
              @{organization.slug}
            </span>
          ) : null}
        </span>
        {canSwitch ? (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-m3-secondary transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        ) : null}
      </button>

      {open && canSwitch ? (
        <div
          role="menu"
          className="absolute left-0 right-0 z-40 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-m3-border bg-m3-card p-1.5 shadow-lg"
        >
          <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-m3-secondary">
            {t("accountOrg.switcher.switch")}
          </p>
          {organizations.map((org) => {
            const isActive = org.id === organization?.id;
            const isSwitching = switchingId === org.id;
            return (
              <button
                key={org.id}
                type="button"
                role="menuitem"
                disabled={isActive || Boolean(switchingId)}
                onClick={() => void onSelect(org)}
                className={`w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-m3-primary/10 text-m3-primary cursor-default"
                    : "text-m3-text hover:bg-m3-hover cursor-pointer disabled:opacity-60"
                }`}
              >
                <OrgAvatar org={org} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold truncate">{org.name}</span>
                  <span className="block text-caption text-m3-secondary truncate">@{org.slug}</span>
                </span>
                {isSwitching ? (
                  <Spinner size="sm" />
                ) : isActive ? (
                  <Check className="h-4 w-4 shrink-0 text-m3-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
