import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/lib/consent";
import { syncAnalyticsWithConsent } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

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
        "fixed z-50 pointer-events-none inset-x-0 bottom-0 p-3 sm:p-5 md:inset-x-auto md:left-6 md:bottom-6 md:p-0",
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
          "pointer-events-auto w-full md:w-[440px] max-w-full font-sans",
          "rounded-[14px] border border-border bg-card p-5 text-card-foreground shadow-md",
          "transition-all duration-200 ease-in-out motion-reduce:transition-none",
          "animate-in fade-in zoom-in-[0.98] duration-200 motion-reduce:animate-none",
          "focus-within:ring-2 focus-within:ring-[#0284c7] dark:focus-within:ring-[#5babdb] focus-within:ring-offset-2",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:text-[#5babdb]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="cookie-banner-title"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              {t("cookieConsent.title")}
            </h2>
            <p id="cookie-banner-desc" className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("cookieConsent.description")}
            </p>
          </div>
        </div>

        <div className="mt-3.5 space-y-2 rounded-lg bg-secondary/50 p-3 text-xs">
          <div>
            <span className="font-medium text-foreground">{t("cookieConsent.essentialTitle")}: </span>
            <span className="text-muted-foreground">{t("cookieConsent.essentialDesc")}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">{t("cookieConsent.analyticsTitle")}: </span>
            <span className="text-muted-foreground">{t("cookieConsent.analyticsDesc")}</span>
          </div>
        </div>

        <p className="mt-2.5 text-[11px] leading-tight text-muted-foreground/90 italic">
          {t("cookieConsent.noSellNotice")}
        </p>

        <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleEssentialOnly}
            className="min-h-[44px] flex-1 sm:flex-initial rounded-[10px] text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#0284c7] dark:focus-visible:ring-[#5babdb] focus-visible:ring-offset-2"
          >
            {t("cookieConsent.essentialOnly")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={handleAcceptAll}
            className="min-h-[44px] flex-1 sm:flex-initial rounded-[10px] bg-[#0284c7] dark:bg-[#5babdb] hover:bg-[#0284c7]/90 dark:hover:bg-[#5babdb]/90 text-white text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#0284c7] dark:focus-visible:ring-[#5babdb] focus-visible:ring-offset-2"
          >
            {t("cookieConsent.acceptAnalytics")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
