import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useI18n } from "@/lib/i18n";
import LanguageToggle, { FlagIcon, LANGUAGE_OPTIONS, type LanguageCode } from "./LanguageToggle";
import TryPlayButton from "./TryPlayButton";

export type { LanguageCode };
export type NavItem = "features" | "chordpro" | "price" | "about" | "contact";

const NAV_ITEMS: NavItem[] = ["features", "chordpro", "price", "about", "contact"];

interface HeroHeaderProps {
  activeNav: NavItem;
  onSelectNav: (item: NavItem) => void;
  onLogoClick: () => void;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  onTryClick: () => void;
  ready: boolean;
}

export default function HeroHeader({
  activeNav,
  onSelectNav,
  onLogoClick,
  language,
  onChangeLanguage,
  onTryClick,
  ready,
}: HeroHeaderProps) {
  const { t } = useI18n();
  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLSpanElement>(null);
  const midBarRef = useRef<HTMLSpanElement>(null);
  const botBarRef = useRef<HTMLSpanElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  // Fast downward entrance animation for logo, nav links, language toggle, and Try button
  useEffect(() => {
    if (!ready || !headerRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = headerRef.current.querySelectorAll("[data-header-item]");

    if (prefersReducedMotion) {
      gsap.set(items, { opacity: 1, y: 0, clearProps: "transform" });
      return;
    }

    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: -14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.42,
        stagger: 0.03,
        delay: 0.04,
        ease: "power3.out",
        clearProps: "transform",
      },
    );

    return () => {
      tween.kill();
    };
  }, [ready]);

  // GSAP hamburger -> X morph and mobile drawer animation
  useEffect(() => {
    const topBar = topBarRef.current;
    const midBar = midBarRef.current;
    const botBar = botBarRef.current;
    const drawer = drawerRef.current;

    if (topBar && midBar && botBar) {
      if (menuOpen) {
        gsap.to(topBar, { y: 5, rotation: 45, duration: 0.35, ease: "power3.inOut" });
        gsap.to(midBar, { opacity: 0, scaleX: 0, duration: 0.25, ease: "power2.out" });
        gsap.to(botBar, { y: -5, rotation: -45, duration: 0.35, ease: "power3.inOut" });
      } else {
        gsap.to(topBar, { y: 0, rotation: 0, duration: 0.35, ease: "power3.inOut" });
        gsap.to(midBar, { opacity: 1, scaleX: 1, duration: 0.28, delay: 0.06, ease: "power2.out" });
        gsap.to(botBar, { y: 0, rotation: 0, duration: 0.35, ease: "power3.inOut" });
      }
    }

    if (drawer) {
      if (menuOpen) {
        gsap.set(drawer, { display: "flex" });
        gsap.fromTo(drawer, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
        const drawerItems = drawer.querySelectorAll("[data-drawer-item]");
        gsap.fromTo(
          drawerItems,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.045, delay: 0.08, ease: "power3.out" },
        );
      } else {
        gsap.to(drawer, {
          opacity: 0,
          duration: 0.25,
          ease: "power2.in",
          onComplete: () => {
            if (!menuOpen && drawer) {
              gsap.set(drawer, { display: "none" });
            }
          },
        });
      }
    }
  }, [menuOpen]);

  const handleLinkHover = (e: React.MouseEvent<HTMLButtonElement>, entering: boolean) => {
    const label = e.currentTarget.querySelector("[data-nav-label]");
    if (!label) return;
    gsap.to(label, {
      y: entering ? -1.5 : 0,
      duration: 0.2,
      ease: "power2.out",
    });
  };

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 inset-x-0 z-30 w-full flex items-center justify-between md:gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4 pointer-events-none bg-white/[0.08] backdrop-blur-md border-b border-white/15 px-4 py-4 md:px-6 md:py-5.5 lg:px-9 lg:py-7"
      >
        {/* Left: Brand logo mark + straight slash + Hosanna Studio wordmark */}
        <div
          data-header-item
          className="lg:justify-self-start opacity-0 pointer-events-auto shrink-0"
        >
          <button
            type="button"
            onClick={() => {
              onLogoClick();
              setMenuOpen(false);
            }}
            aria-label="Hosanna Studio home"
            className="inline-flex items-center gap-1.5 md:gap-1.75 lg:gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/80 rounded-sm"
          >
            <img
              src="/assets/logo_icon.png"
              alt=""
              aria-hidden="true"
              className="h-4.5 md:h-5.5 lg:h-7 w-auto block shrink-0 select-none"
              draggable={false}
            />
            <span
              aria-hidden="true"
              className="w-px h-2.5 md:h-3 lg:h-3.75 bg-[rgba(255,255,255,0.5)] shrink-0"
            />
            <img
              src="/assets/wordmark_studio.svg"
              alt="Hosanna Studio"
              className="h-2.25 md:h-2.75 lg:h-3.5 w-auto block shrink-0 select-none"
              draggable={false}
            />
          </button>
        </div>

        {/* Center: Aligned horizontal navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex lg:justify-self-center items-center md:gap-3.5 lg:gap-7 pointer-events-auto"
        >
          {NAV_ITEMS.map((id) => {
            const isActive = activeNav === id;
            return (
              <div key={id} data-header-item className="opacity-0">
                <button
                  type="button"
                  onClick={() => onSelectNav(id)}
                  onMouseEnter={(e) => handleLinkHover(e, true)}
                  onMouseLeave={(e) => handleLinkHover(e, false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center md:text-[9.5px] lg:text-[10.5px] font-medium uppercase md:tracking-[0.06em] lg:tracking-[0.08em] leading-none py-2 whitespace-nowrap shrink-0 cursor-pointer transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/80 rounded-sm ${
                    isActive
                      ? "text-white opacity-100"
                      : "text-white opacity-[0.72] hover:opacity-100"
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-px left-1/2 -translate-x-1/2 w-[3.5px] h-[3.5px] rounded-full bg-white"
                    />
                  )}
                  <span data-nav-label className="inline-block">
                    {t(`landing.nav.${id === "price" ? "pricing" : id}`)}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>

        {/* Top-Right: Rounded language dropdown (PT/EN/ES) + Try button */}
        <div
          data-header-item
          className="hidden md:flex lg:justify-self-end items-center md:gap-2 lg:gap-2.5 opacity-0 pointer-events-auto shrink-0"
        >
          <LanguageToggle
            language={language}
            onChangeLanguage={onChangeLanguage}
            size="responsive"
          />
          <TryPlayButton label={t("landing.nav.tryFree")} onClick={onTryClick} size="md" />
        </div>

        {/* Mobile actions (compact language toggle + Try button + hamburger) (< 768px) */}
        <div
          data-header-item
          className="md:hidden flex items-center gap-1.5 opacity-0 pointer-events-auto"
        >
          <LanguageToggle language={language} onChangeLanguage={onChangeLanguage} size="sm" />
          <TryPlayButton label={t("landing.nav.tryFree")} onClick={onTryClick} size="sm" />

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            className="relative z-40 w-8 h-9 -mr-1.5 flex flex-col items-center justify-center gap-[3.5px] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/80 rounded-sm"
          >
            <span ref={topBarRef} className="block w-4 h-[1.5px] bg-white origin-center" />
            <span ref={midBarRef} className="block w-4 h-[1.5px] bg-white origin-center" />
            <span ref={botBarRef} className="block w-4 h-[1.5px] bg-white origin-center" />
          </button>
        </div>
      </header>

      {/* Mobile full-screen navigation drawer (z-30) */}
      <div
        ref={drawerRef}
        style={{ display: "none" }}
        aria-hidden={!menuOpen}
        className="fixed inset-0 z-30 md:hidden flex-col justify-between bg-[rgba(4,11,20,0.95)] backdrop-blur-md px-5.5 pt-23 pb-7 pointer-events-auto"
      >
        <nav aria-label="Mobile navigation">
          <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
            {NAV_ITEMS.map((id) => {
              const isActive = activeNav === id;
              return (
                <li key={id} data-drawer-item>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectNav(id);
                      setMenuOpen(false);
                    }}
                    className={`relative flex items-center min-h-11 text-[18px] font-medium uppercase tracking-[0.08em] cursor-pointer transition-opacity duration-200 ${
                      isActive
                        ? "text-white opacity-100"
                        : "text-white opacity-65 hover:opacity-100"
                    }`}
                  >
                    {isActive && (
                      <span aria-hidden="true" className="w-1 h-1 rounded-full bg-white mr-2.5" />
                    )}
                    {t(`landing.nav.${id === "price" ? "pricing" : id}`)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-5">
          <div
            data-drawer-item
            className="flex items-center justify-between border-t border-white/15 pt-4"
          >
            <span className="text-[10.5px] uppercase tracking-[0.08em] text-white/70">
              {language === "en" ? "Language" : "Idioma"}
            </span>
            <div className="inline-flex items-center p-1 rounded-full border border-white/25 bg-white/6 gap-0.5">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => onChangeLanguage(opt.code)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em] rounded-full cursor-pointer transition-colors ${
                    language === opt.code
                      ? "bg-white/25 text-white"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  <FlagIcon code={opt.code} className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div data-drawer-item className="grid grid-cols-1 gap-3 text-[12px] leading-[1.35]">
            <div>
              <p className="font-medium text-white">Smart Songbook</p>
              <p className="text-[rgba(255,255,255,0.78)]">
                {language === "pt"
                  ? "Cifras ChordPro e tons instantâneos"
                  : language === "es"
                    ? "Cifrados ChordPro y tonos al instante"
                    : "ChordPro charts & instant keys"}
              </p>
            </div>
            <div>
              <p className="font-medium text-white">Service Flow</p>
              <p className="text-[rgba(255,255,255,0.78)]">
                {language === "pt"
                  ? "Escalas, equipes e deixas em um só lugar"
                  : language === "es"
                    ? "Turnos, equipos y señales en un solo lugar"
                    : "Schedules, teams & cues in one place"}
              </p>
            </div>
            <div>
              <p className="font-medium text-white">Hosanna Studio</p>
              <p className="text-[rgba(255,255,255,0.78)]">
                {language === "pt"
                  ? "Grátis para começar, feito para crescer"
                  : language === "es"
                    ? "Gratis para empezar, hecho para crecer"
                    : "Free to start, built to scale"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
