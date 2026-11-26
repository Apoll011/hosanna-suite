// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef } from "react";
import { ShieldCheck, X } from "lucide-react";
import { syncAnalyticsWithConsent } from "@/lib/analytics";
import { useCookieConsent } from "@/lib/consent";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CookieBanner() {
  const { isOpen, acceptAll, acceptEssentialOnly, close } = useCookieConsent();
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    syncAnalyticsWithConsent();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const handleAcceptAll = () => {
    acceptAll();
    syncAnalyticsWithConsent();
  };

  const handleEssentialOnly = () => {
    acceptEssentialOnly();
    syncAnalyticsWithConsent();
  };

  return (
    <div
      role="region"
      aria-label={t("cookieConsent.title")}
      className={cn(
        "fixed z-50 pointer-events-none inset-x-0 bottom-0 p-3 sm:p-4 md:inset-x-auto md:left-5 md:bottom-5 md:p-0",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-desc"
        className={cn(
          "pointer-events-auto w-full md:w-105 max-w-full font-sans",
          "rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-md p-4 text-white shadow-2xl",
          "transition-all duration-200 ease-in-out motion-reduce:transition-none",
          "animate-in fade-in zoom-in-[0.98] duration-200 motion-reduce:animate-none",
          "focus-within:ring-2 focus-within:ring-[#0284c7] focus-within:ring-offset-2 focus-within:ring-offset-slate-950",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0284c7]/20 text-[#38bdf8]">
              <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="cookie-banner-title"
                className="text-sm font-semibold tracking-tight text-white leading-tight"
              >
                {t("cookieConsent.title")}
              </h2>
              <p id="cookie-banner-desc" className="mt-1 text-xs leading-relaxed text-slate-300">
                {t("cookieConsent.description")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3.5 space-y-2 rounded-xl bg-white/6 border border-white/10 p-3 text-xs leading-normal">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-slate-100">{t("cookieConsent.essentialTitle")}</span>
            <span className="text-slate-400 text-[11px] leading-snug">
              {t("cookieConsent.essentialDesc")}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 pt-1 border-t border-white/5">
            <span className="font-medium text-slate-100">{t("cookieConsent.analyticsTitle")}</span>
            <span className="text-slate-400 text-[11px] leading-snug">
              {t("cookieConsent.analyticsDesc")}
            </span>
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-normal text-slate-400 italic">
          {t("cookieConsent.noSellNotice")}
        </p>

        <div className="mt-3.5 flex flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="h-8.5 sm:h-9 flex-1 sm:flex-initial rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer"
          >
            {t("cookieConsent.essentialOnly")}
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="h-8.5 sm:h-9 flex-1 sm:flex-initial rounded-lg bg-[#0284c7] hover:bg-[#0369a1] active:bg-[#075985] text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer"
          >
            {t("cookieConsent.acceptAnalytics")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
