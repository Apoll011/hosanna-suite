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
        "fixed z-40 pointer-events-none inset-x-0 bottom-0 p-2.5 sm:p-3 md:inset-x-auto md:left-5 md:bottom-5 md:p-0",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-desc"
        className={cn(
          "pointer-events-auto w-full md:w-[410px] max-w-full font-sans",
          "rounded-[14px] border border-border bg-card/95 backdrop-blur-xs p-3.5 md:p-3.5 text-card-foreground shadow-md",
          "transition-all duration-200 ease-in-out motion-reduce:transition-none",
          "animate-in fade-in zoom-in-[0.98] duration-200 motion-reduce:animate-none",
          "focus-within:ring-2 focus-within:ring-[#0284c7] dark:focus-within:ring-[#5babdb] focus-within:ring-offset-2",
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary dark:text-[#5babdb]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="cookie-banner-title"
              className="text-xs font-semibold tracking-tight text-foreground leading-tight"
            >
              {t("cookieConsent.title")}
            </h2>
            <p id="cookie-banner-desc" className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {t("cookieConsent.description")}
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-1.5 rounded-lg bg-secondary/50 px-2.5 py-2 text-[11px] leading-tight">
          <div>
            <span className="font-medium text-foreground">{t("cookieConsent.essentialTitle")}: </span>
            <span className="text-muted-foreground">{t("cookieConsent.essentialDesc")}</span>
          </div>
          <div>
            <span className="font-medium text-foreground">{t("cookieConsent.analyticsTitle")}: </span>
            <span className="text-muted-foreground">{t("cookieConsent.analyticsDesc")}</span>
          </div>
        </div>

        <p className="mt-1.5 text-[10px] leading-none text-muted-foreground/80 italic">
          {t("cookieConsent.noSellNotice")}
        </p>

        <div className="mt-2.5 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEssentialOnly}
            className="h-8 min-h-[34px] sm:min-h-[36px] flex-1 sm:flex-initial rounded-[8px] px-3 py-1 text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-[#0284c7] dark:focus-visible:ring-[#5babdb] focus-visible:ring-offset-2"
          >
            {t("cookieConsent.essentialOnly")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAcceptAll}
            className="h-8 min-h-[34px] sm:min-h-[36px] flex-1 sm:flex-initial rounded-[8px] bg-[#0284c7] dark:bg-[#5babdb] hover:bg-[#0284c7]/90 dark:hover:bg-[#5babdb]/90 text-white px-3 py-1 text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-[#0284c7] dark:focus-visible:ring-[#5babdb] focus-visible:ring-offset-2"
          >
            {t("cookieConsent.acceptAnalytics")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
