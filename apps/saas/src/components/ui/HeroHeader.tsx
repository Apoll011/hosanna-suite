import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useI18n } from "@/lib/i18n";
import LanguageToggle, { FlagIcon, LANGUAGE_OPTIONS, type LanguageCode } from "./LanguageToggle";
import TryPlayButton from "./TryPlayButton";

export type { LanguageCode };
export type NavItem = "features" | "chordpro" | "price" | "about" | "contact";

const NAV_ITEMS: NavItem[] = ["features", "chordpro", "price", "about", "contact"];

function getNavTarget(id: NavItem): { to: string; hash?: string } {
  switch (id) {
    case "features":
      return { to: "/", hash: "features" };
    case "chordpro":
      return { to: "/chordpro" };
    case "price":
      return { to: "/", hash: "pricing" };
    case "about":
      return { to: "/about" };
    case "contact":
      return { to: "/contact" };
  }
}

interface HeroHeaderProps {
  activeNav?: NavItem;
  onSelectNav?: (item: NavItem) => void;
  onLogoClick?: () => void;
  language?: LanguageCode;
  onChangeLanguage?: (lang: LanguageCode) => void;
  onTryClick?: () => void;
  ready?: boolean;
  mode?: "hero" | "scrolled-only";
}

const dashboardUrl = `${import.meta.env.VITE_DASHBOARD_URL}/new`;

export default function HeroHeader({
  activeNav: propActiveNav,
  onSelectNav: propOnSelectNav,
  onLogoClick: propOnLogoClick,
  language: propLanguage,
  onChangeLanguage: propOnChangeLanguage,
  onTryClick: propOnTryClick,
  ready = true,
  mode = "hero",
}: HeroHeaderProps) {
  const { language: i18nLang, setLanguage: setI18nLang, t } = useI18n();
  const language = propLanguage || (i18nLang as LanguageCode);
  const onChangeLanguage = propOnChangeLanguage || setI18nLang;

  const navigate = useNavigate();
  const location = useLocation();

  const [localActiveNav, setLocalActiveNav] = useState<NavItem>("features");

  const getIsActive = (id: NavItem) => {
    if (propActiveNav !== undefined) {
      return propActiveNav === id;
    }
    if (location.pathname === "/about") return id === "about";
    if (location.pathname === "/chordpro") return id === "chordpro";
    if (location.pathname === "/contact") return id === "contact";
    if (location.pathname === "/") {
      if (location.hash === "pricing") return id === "price";
      if (location.hash === "features") return id === "features";
      return id === localActiveNav;
    }
    return false;
  };
  const activeNav = propActiveNav !== undefined ? propActiveNav : localActiveNav;

  const onSelectNav =
    propOnSelectNav ||
    ((item: NavItem) => {
      setLocalActiveNav(item);
      if (item === "chordpro" || item === "about" || item === "contact") {
        navigate({ to: `/${item}`, viewTransition: true });
        return;
      }
      const targetId = item === "price" ? "pricing" : "features";
      const target = document.getElementById(targetId);
      if (target && location.pathname === "/") {
        target.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `/#${targetId}`);
      } else {
        navigate({ to: "/", hash: targetId, viewTransition: true });
      }
    });

  const onLogoClick =
    propOnLogoClick ||
    (() => {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", "/#top");
      } else {
        navigate({ to: "/", hash: "top", viewTransition: true });
      }
    });

  const onTryClick =
    propOnTryClick ||
    (() => {
      window.location.assign(dashboardUrl);
    });
  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLSpanElement>(null);
  const midBarRef = useRef<HTMLSpanElement>(null);
  const botBarRef = useRef<HTMLSpanElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrolledPanelOpen, setScrolledPanelOpen] = useState(false);
  const openScrollYRef = useRef<number>(0);
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;

  useEffect(() => {
    if (mode === "scrolled-only") {
      setIsScrolled(true);
      const handleScrollOnly = () => {
        const scrollY = window.scrollY;
        if (openScrollYRef.current > 0 && Math.abs(scrollY - openScrollYRef.current) > 8) {
          setScrolledPanelOpen(false);
          openScrollYRef.current = 0;
        }
      };
      window.addEventListener("scroll", handleScrollOnly, { passive: true });
      return () => window.removeEventListener("scroll", handleScrollOnly);
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroEl = headerRef.current?.closest("section") || document.getElementById("top");
      const heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;
      const pastHero = scrollY >= heroHeight - 80;

      setIsScrolled(pastHero);

      if (!pastHero) {
        setScrolledPanelOpen(false);
      } else {
        if (menuOpenRef.current) {
          setMenuOpen(false);
        }
        if (openScrollYRef.current > 0 && Math.abs(scrollY - openScrollYRef.current) > 8) {
          setScrolledPanelOpen(false);
          openScrollYRef.current = 0;
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setScrolledPanelOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleScrolledPanel = () => {
    setScrolledPanelOpen((prev) => {
      const next = !prev;
      openScrollYRef.current = next ? window.scrollY : 0;
      return next;
    });
  };

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

  // GSAP hamburger -> X morph and mobile drawer animation for Hero section
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

  const handleLinkHover = (e: React.MouseEvent<HTMLElement>, entering: boolean) => {
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
      {/* 1. Standard Transparent Hero Navbar (Section 1 / Hero only) */}
      {mode !== "scrolled-only" && (
        <header
          ref={headerRef}
          aria-hidden={isScrolled}
          className="absolute top-0 inset-x-0 z-30 w-full pointer-events-none"
        >
          <div className="w-full flex items-center justify-between md:gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4 px-4 py-4 md:px-6 md:py-5.5 lg:px-9 lg:py-7 font-sans">
            {/* Left: Brand logo mark + straight slash + Hosanna Studio wordmark */}
            <div
              data-header-item
              className="lg:justify-self-start opacity-0 pointer-events-auto shrink-0"
            >
              <Link
                to="/"
                hash="top"
                preload="intent"
                viewTransition
                onClick={(e) => {
                  onLogoClick();
                  if (location.pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                  setMenuOpen(false);
                }}
                aria-label="Hosanna Studio home"
                className="inline-flex items-center gap-1.5 md:gap-1.75 lg:gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/80 rounded-sm"
              >
                <img
                  src="/assets/logo_icon.png"
                  alt="Hosanna Studio"
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
              </Link>
            </div>

            {/* Center: Aligned horizontal navigation links */}
            <nav
              aria-label="Primary navigation"
              className="hidden md:flex lg:justify-self-center items-center md:gap-3.5 lg:gap-7 pointer-events-auto"
            >
              {NAV_ITEMS.map((id) => {
                const isActive = getIsActive(id);
                const target = getNavTarget(id);
                return (
                  <div key={id} data-header-item className="opacity-0">
                    <Link
                      to={target.to}
                      hash={target.hash}
                      preload="intent"
                      viewTransition
                      onClick={(e) => {
                        onSelectNav(id);
                        if (id === "features" || id === "price") {
                          const targetId = id === "price" ? "pricing" : "features";
                          const targetEl = document.getElementById(targetId);
                          if (targetEl && location.pathname === "/") {
                            e.preventDefault();
                            targetEl.scrollIntoView({ behavior: "smooth" });
                            window.history.pushState(null, "", `/#${targetId}`);
                          }
                        }
                      }}
                      onMouseEnter={(e) => handleLinkHover(e, true)}
                      onMouseLeave={(e) => handleLinkHover(e, false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative flex items-center md:text-[9.5px] lg:text-[10.5px] font-medium uppercase md:tracking-[0.06em] lg:tracking-[0.08em] leading-none py-2 whitespace-nowrap shrink-0 cursor-pointer transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/80 rounded-sm text-white ${
                        isActive ? "opacity-100" : "opacity-[0.72] hover:opacity-100"
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
                    </Link>
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
                theme="dark"
              />
              <TryPlayButton
                label={t("landing.nav.tryFree")}
                onClick={onTryClick}
                size="md"
                theme="dark"
              />
            </div>

            {/* Mobile actions (compact language toggle + Try button + hamburger) (< 768px) */}
            <div
              data-header-item
              className="md:hidden flex items-center gap-1.5 opacity-0 pointer-events-auto"
            >
              <LanguageToggle
                language={language}
                onChangeLanguage={onChangeLanguage}
                size="sm"
                theme="dark"
              />
              <TryPlayButton
                label={t("landing.nav.tryFree")}
                onClick={onTryClick}
                size="sm"
                theme="dark"
              />

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
          </div>

          {/* Mobile full-screen navigation drawer for Hero section */}
          <div
            ref={drawerRef}
            style={{ display: "none" }}
            aria-hidden={!menuOpen}
            className="fixed inset-0 z-30 md:hidden flex-col justify-between bg-[rgba(4,11,20,0.95)] backdrop-blur-md px-5.5 pt-23 pb-7 font-sans pointer-events-auto"
          >
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
                {NAV_ITEMS.map((id) => {
                  const isActive = getIsActive(id);
                  const target = getNavTarget(id);
                  return (
                    <li key={id} data-drawer-item>
                      <Link
                        to={target.to}
                        hash={target.hash}
                        preload="intent"
                        viewTransition
                        onClick={(e) => {
                          onSelectNav(id);
                          if (id === "features" || id === "price") {
                            const targetId = id === "price" ? "pricing" : "features";
                            const targetEl = document.getElementById(targetId);
                            if (targetEl && location.pathname === "/") {
                              e.preventDefault();
                              targetEl.scrollIntoView({ behavior: "smooth" });
                              window.history.pushState(null, "", `/#${targetId}`);
                            }
                          }
                          setMenuOpen(false);
                        }}
                        className={`relative flex items-center min-h-11 text-[18px] font-medium uppercase tracking-[0.08em] cursor-pointer transition-opacity duration-200 ${
                          isActive
                            ? "text-white opacity-100"
                            : "text-white opacity-65 hover:opacity-100"
                        }`}
                      >
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="w-1 h-1 rounded-full bg-white mr-2.5"
                          />
                        )}
                        {t(`landing.nav.${id === "price" ? "pricing" : id}`)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex flex-col gap-5">
              <div data-drawer-item>
                <a
                  href={dashboardUrl}
                  className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold tracking-wide text-[#021433] transition-colors hover:bg-white/90"
                >
                  {t("landing.pricing.ctaTry")}
                </a>
              </div>

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
        </header>
      )}

      {/* 2. Floating Circular Ball (Section 2+ Scrolled State) */}
      <button
        type="button"
        onClick={toggleScrolledPanel}
        aria-label={scrolledPanelOpen ? "Close menu" : "Open menu"}
        aria-expanded={scrolledPanelOpen}
        className={`fixed top-3 md:top-3.5 lg:top-4 right-4 md:right-6 lg:right-9 z-50 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
          isScrolled
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-75 pointer-events-none -translate-y-2"
        } ${
          scrolledPanelOpen
            ? "bg-[#021433] hover:bg-[#03204e] text-white border border-[#021433]/30 shadow-xl"
            : "bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/25 shadow-lg"
        }`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          <span
            className={`absolute h-[1.75px] w-4.5 bg-white rounded-full transition-all duration-300 ease-in-out origin-center ${
              scrolledPanelOpen ? "translate-y-0 rotate-45" : "-translate-y-1.5"
            }`}
          />
          <span
            className={`absolute h-[1.75px] w-4.5 bg-white rounded-full transition-all duration-200 ease-in-out ${
              scrolledPanelOpen ? "opacity-0 scale-x-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute h-[1.75px] w-4.5 bg-white rounded-full transition-all duration-300 ease-in-out origin-center ${
              scrolledPanelOpen ? "translate-y-0 -rotate-45" : "translate-y-1.5"
            }`}
          />
        </div>
      </button>

      {/* 3. Pure-White Full-Width Top Navbar Drawer (Section 2+ Expanded State) */}
      <div
        aria-hidden={!scrolledPanelOpen || !isScrolled}
        className={`fixed top-0 inset-x-0 z-40 bg-white border-b border-black/10 shadow-[0_12px_32px_-12px_rgba(2,20,51,0.18)] transition-transform duration-300 ease-out px-4 py-3.5 md:px-6 md:py-4 lg:px-9 lg:py-4.5 font-sans ${
          scrolledPanelOpen && isScrolled
            ? "translate-y-0 pointer-events-auto"
            : "-translate-y-full pointer-events-none"
        }`}
      >
        <div className="w-full flex items-center justify-between md:gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4">
          {/* Left: Brand lockup with dark ink contrast on white */}
          <div className="lg:justify-self-start shrink-0">
            <Link
              to="/"
              hash="top"
              preload="intent"
              viewTransition
              onClick={(e) => {
                onLogoClick();
                if (location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
                setScrolledPanelOpen(false);
              }}
              aria-label="Hosanna Studio home"
              className="inline-flex items-center gap-1.5 md:gap-1.75 lg:gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#021433]/60 rounded-sm"
            >
              <img
                src="/assets/logo_icon.png"
                alt="Hosanna Studio"
                aria-hidden="true"
                className="h-4.5 md:h-5.5 lg:h-7 w-auto block shrink-0 select-none"
                draggable={false}
              />
              <span
                aria-hidden="true"
                className="w-px h-2.5 md:h-3 lg:h-3.75 bg-[#021433]/30 shrink-0"
              />
              <img
                src="/assets/wordmark_studio.svg"
                alt="Hosanna Studio"
                className="h-2.25 md:h-2.75 lg:h-3.5 w-auto block shrink-0 select-none brightness-0"
                draggable={false}
              />
            </Link>
          </div>

          {/* Center: Nav links in high-contrast dark blue (#021433) */}
          <nav
            aria-label="Scrolled drawer navigation"
            className="hidden md:flex lg:justify-self-center items-center md:gap-3.5 lg:gap-7"
          >
            {NAV_ITEMS.map((id) => {
              const isActive = getIsActive(id);
              const target = getNavTarget(id);
              return (
                <Link
                  key={id}
                  to={target.to}
                  hash={target.hash}
                  preload="intent"
                  viewTransition
                  onClick={(e) => {
                    onSelectNav(id);
                    if (id === "features" || id === "price") {
                      const targetId = id === "price" ? "pricing" : "features";
                      const targetEl = document.getElementById(targetId);
                      if (targetEl && location.pathname === "/") {
                        e.preventDefault();
                        targetEl.scrollIntoView({ behavior: "smooth" });
                        window.history.pushState(null, "", `/#${targetId}`);
                      }
                    }
                    setScrolledPanelOpen(false);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center md:text-[9.5px] lg:text-[10.5px] font-semibold uppercase md:tracking-[0.06em] lg:tracking-[0.08em] leading-none py-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#021433]/60 rounded-sm ${
                    isActive
                      ? "text-[#021433] opacity-100 font-bold"
                      : "text-[#021433]/70 hover:text-[#021433] hover:opacity-100"
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-px left-1/2 -translate-x-1/2 w-[3.5px] h-[3.5px] rounded-full bg-[#021433]"
                    />
                  )}
                  <span>{t(`landing.nav.${id === "price" ? "pricing" : id}`)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Language toggle + Try button with breathing room for the floating ball */}
          <div className="flex items-center gap-2 lg:gap-2.5 lg:justify-self-end pr-13 md:pr-15 lg:pr-16 shrink-0">
            <LanguageToggle
              language={language}
              onChangeLanguage={onChangeLanguage}
              size="responsive"
              theme="light"
            />
            <TryPlayButton
              label={t("landing.nav.tryFree")}
              onClick={() => {
                onTryClick();
                setScrolledPanelOpen(false);
              }}
              size="md"
              theme="light"
            />
          </div>
        </div>

        {/* Compact mobile nav links sub-row */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 border-t border-black/5 mt-2.5">
          {NAV_ITEMS.map((id) => {
            const isActive = getIsActive(id);
            const target = getNavTarget(id);
            return (
              <Link
                key={id}
                to={target.to}
                hash={target.hash}
                preload="intent"
                viewTransition
                onClick={(e) => {
                  onSelectNav(id);
                  if (id === "features" || id === "price") {
                    const targetId = id === "price" ? "pricing" : "features";
                    const targetEl = document.getElementById(targetId);
                    if (targetEl && location.pathname === "/") {
                      e.preventDefault();
                      targetEl.scrollIntoView({ behavior: "smooth" });
                      window.history.pushState(null, "", `/#${targetId}`);
                    }
                  }
                  setScrolledPanelOpen(false);
                }}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full shrink-0 transition-colors ${
                  isActive
                    ? "bg-[#021433] text-white"
                    : "text-[#021433]/70 hover:text-[#021433] bg-[#021433]/5"
                }`}
              >
                {t(`landing.nav.${id === "price" ? "pricing" : id}`)}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
