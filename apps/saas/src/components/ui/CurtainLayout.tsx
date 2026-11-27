// SPDX-License-Identifier: AGPL-3.0-only
import { type ReactNode, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Instagram } from "lucide-react";
import logo from "@/assets/hosanna_logo.webp";
import { reopenCookieBanner } from "@/lib/consent";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import WebGLCanvas from "./WebGLCanvas";

const githubAppUrl = "https://github.com/Apoll011/Hosanna";

export function Footer() {
  const { t } = useI18n();
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const footerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footerEl = footerRef.current;
    const innerEl = innerRef.current;
    if (!footerEl || !innerEl) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafId = 0;

    const updateParallax = () => {
      rafId = 0;
      if (prefersReducedMotion || window.innerWidth < 768) {
        innerEl.style.transform = "translate3d(0, 0%, 0)";
        return;
      }

      const mainEl = footerEl.previousElementSibling as HTMLElement | null;
      if (!mainEl) {
        innerEl.style.transform = "translate3d(0, 0%, 0)";
        return;
      }

      const mainRect = mainEl.getBoundingClientRect();
      const footerHeight = footerEl.offsetHeight || window.innerHeight * 0.88;
      const uncovered = window.innerHeight - mainRect.bottom;
      const progress = Math.min(1, Math.max(0, uncovered / Math.max(1, footerHeight)));
      const translatePct = (1 - progress) * 38;
      innerEl.style.transform = `translate3d(0, ${translatePct.toFixed(3)}%, 0)`;
    };

    const scheduleUpdate = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateParallax);
      }
    };

    updateParallax();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  const colProduct = [
    { label: t("landing.footer.features"), href: "/#features", isInternal: false },
    { label: t("landing.footer.chordproGuide"), href: "/chordpro", isInternal: true },
    { label: t("landing.footer.pricing"), href: "/#pricing", isInternal: false },
    { label: t("landing.footer.downloadApp"), href: "/#mobile", isInternal: false },
    { label: t("landing.footer.openSource"), href: "/#open-source", isInternal: false },
  ];

  const colNav = [
    { label: t("common.backToHome"), href: "/", isInternal: true },
    { label: t("landing.nav.about"), href: "/about", isInternal: true },
    { label: t("landing.footer.contact"), href: "/contact", isInternal: true },
    { label: t("landing.footer.termsOfService"), href: "/terms", isInternal: true },
    { label: t("landing.footer.privacyPolicy"), href: "/privacy", isInternal: true },
    { label: t("landing.footer.subprocessors"), href: "/subprocessors", isInternal: true },
    {
      label: t("cookieConsent.cookieSettings"),
      onClick: () => reopenCookieBanner(),
      isAction: true,
    },
  ];

  return (
    <footer
      ref={footerRef}
      className="relative z-10 md:sticky md:bottom-0 md:z-10 md:min-h-[88vh] flex flex-col justify-between bg-white text-[#021433] pt-16 md:pt-20 pb-10 md:pb-12 border-t border-slate-200/80 overflow-hidden"
    >
      <div
        ref={innerRef}
        className="mx-auto w-full max-w-7xl px-6 md:px-8 flex-1 flex flex-col justify-between will-change-transform"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 flex flex-col items-start">
            <Link
              to="/"
              hash="top"
              className="inline-block transition-transform hover:scale-105 mb-6"
            >
              <img
                src={logo}
                alt="Hosanna Studio"
                className="w-12 h-12 rounded-xl object-contain shadow-sm"
              />
            </Link>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#021433] leading-snug tracking-tight">
              Música para a igreja.
              <br />
              Simples, moderno e fiável.
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-500 leading-relaxed max-w-sm">
              {t("landing.footer.tagline")}
            </p>
            <a
              href="mailto:hosanna.songbook@gmail.com"
              className="inline-flex items-center gap-2 mt-6 text-base font-semibold text-[#0284c7] hover:text-[#0369a1] transition-colors group"
            >
              hosanna.songbook@gmail.com
              <span className="transition-transform group-hover:translate-x-1 font-bold">→</span>
            </a>

            <div className="mt-6 flex items-center gap-2.5">
              <a
                href={githubAppUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg border border-[#021433]/12 bg-[#021433]/3 hover:bg-[#021433]/8 text-[#021433] inline-flex items-center justify-center transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/hosanna.songbook"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-lg border border-[#021433]/12 bg-[#021433]/3 hover:bg-[#021433]/8 text-[#021433] inline-flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://blog.hosanna.live"
                target="_blank"
                rel="noreferrer"
                aria-label="Blog"
                className="w-9 h-9 rounded-lg border border-[#021433]/12 bg-[#021433]/3 hover:bg-[#021433]/8 text-[#021433] inline-flex items-center justify-center transition-colors"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-10 lg:justify-items-end">
            <div className="w-full max-w-52">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
                {t("landing.footer.colProduct")}
              </div>
              <ul className="mt-6 space-y-3.5 text-sm font-sans">
                {colProduct.map((link) => {
                  const isActive = link.isInternal && link.href === currentPath;
                  return (
                    <li key={link.label} className="relative flex items-center">
                      {link.isInternal ? (
                        <Link
                          to={link.href}
                          className={cn(
                            "transition-colors font-medium",
                            isActive
                              ? "text-[#0284c7] font-bold"
                              : "text-slate-600 hover:text-[#0284c7]",
                          )}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-slate-600 transition-colors hover:text-[#0284c7] font-medium"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="w-full max-w-52">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans">
                {t("landing.footer.colNavigation")}
              </div>
              <ul className="mt-6 space-y-3.5 text-sm font-sans">
                {colNav.map((link) => {
                  const isActive = "href" in link && link.href === currentPath;
                  return (
                    <li key={link.label} className="relative flex items-center">
                      {"isAction" in link && link.isAction ? (
                        <button
                          type="button"
                          onClick={link.onClick}
                          className="text-left text-slate-600 transition-colors hover:text-[#0284c7] font-medium cursor-pointer"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link
                          to={link.href}
                          className={cn(
                            "transition-colors font-medium",
                            isActive
                              ? "text-[#0284c7] font-bold"
                              : "text-slate-600 hover:text-[#0284c7]",
                          )}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center sm:justify-end gap-3.5">
          <button
            type="button"
            className="bg-[#0284c7] text-white rounded-xl px-5 py-3 inline-flex items-center gap-3 shadow-sm cursor-default select-none"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 shrink-0"
              aria-hidden="true"
            >
              <path d="M3.609 1.814L13.792 12 3.61 22.186a1.75 1.75 0 01-.61-1.335V3.149c0-.517.224-.993.609-1.335zm11.24 11.241l2.893 2.893-10.37 5.915 7.477-8.808zm3.949-1.838l2.587 1.476c.82.468.82 1.146 0 1.614l-2.587 1.476-3.17-3.17 3.17-3.396zM7.372 2.137l10.37 5.915-2.893 2.893-7.477-8.808z" />
            </svg>
            <span className="flex flex-col text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider leading-none text-white/85">
                GET IT ON
              </span>
              <span className="text-sm font-bold leading-tight text-white">Google Play</span>
            </span>
          </button>

          <button
            type="button"
            className="bg-[#0284c7] text-white rounded-xl px-5 py-3 inline-flex items-center gap-3 shadow-sm cursor-default select-none"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 shrink-0"
              aria-hidden="true"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.33c.67-.81 1.12-1.94 1-3.08-.96.04-2.13.64-2.82 1.45-.61.7-.14 1.86-1.01 2.97 1.07.08 2.16-.53 2.83-1.34" />
            </svg>
            <span className="flex flex-col text-left">
              <span className="text-[10px] font-medium tracking-wide leading-none text-white/85">
                Download on the
              </span>
              <span className="text-sm font-bold leading-tight text-white">App Store</span>
            </span>
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-xs text-slate-500">
          <div className="hidden sm:block" aria-hidden="true" />
          <div className="text-center">
            © {new Date().getFullYear()} Hosanna Studio. {t("landing.footer.copyright")}
          </div>

          <div className="flex justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-[#021433]/25 flex items-center justify-center text-xs font-semibold tracking-wider text-[#021433] hover:bg-[#021433] hover:text-white transition-colors cursor-pointer shrink-0 active:scale-95"
              aria-label="Voltar ao topo"
            >
              TOP ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface CurtainLayoutProps {
  children: ReactNode;
  canvas?: ReactNode;
  className?: string;
}

export function CurtainLayout({ children, canvas, className }: CurtainLayoutProps) {
  return (
    <div
      className={cn("min-h-screen overflow-x-clip bg-[#021433] font-sans antialiased", className)}
    >
      <main className="relative z-20 bg-[#021433]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="sticky top-0 h-screen w-full overflow-hidden">
            {canvas ?? <WebGLCanvas showTextLayer={false} />}
          </div>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
