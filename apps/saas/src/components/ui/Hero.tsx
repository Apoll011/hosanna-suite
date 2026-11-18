import { useI18n } from "@/lib/i18n";
import { useCallback, useRef, useState } from "react";
import HeroCtas from "./HeroCtas";
import HeroFooter from "./HeroFooter";
import HeroHeader, { type NavItem } from "./HeroHeader";
import SplashScreen from "./SplashScreen";
import WebGLCanvas from "./WebGLCanvas";

const dashboardUrl = `${import.meta.env.VITE_DASHBOARD_URL}/new`;

export default function Hero() {
  const { language, setLanguage, t } = useI18n();
  const [activeNav, setActiveNav] = useState<NavItem>("features");
  const [fontsReady, setFontsReady] = useState(false);
  const [splashRevealed, setSplashRevealed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.sessionStorage.getItem("hosanna_splash_seen") === "true" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch {
      return false;
    }
  });
  const impulseTriggerRef = useRef<((targetUv?: { x: number; y: number }) => void) | null>(null);

  const heroReady = fontsReady && splashRevealed;

  const handleSelectNav = useCallback((item: NavItem) => {
    setActiveNav(item);
    if (item === "chordpro" || item === "about" || item === "contact") {
      window.location.assign(`/${item === "chordpro" ? "chordpro" : item}`);
      return;
    }
    document.getElementById(item === "price" ? "pricing" : "features")?.scrollIntoView({
      behavior: "smooth",
    });
    impulseTriggerRef.current?.();
  }, []);

  const handleLogoClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    impulseTriggerRef.current?.({ x: 0.5, y: 0.465 });
  }, []);

  const handleStartClick = useCallback(() => {
    window.location.assign(dashboardUrl);
  }, []);

  const handleDemoClick = useCallback(() => {
    document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
    impulseTriggerRef.current?.({ x: 0.5, y: 0.52 });
  }, []);

  const handleScrollClick = useCallback(() => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    impulseTriggerRef.current?.({ x: 0.52, y: 0.48 });
  }, []);

  const headlineLines = [
    t("landing.newHero.line1"),
    t("landing.newHero.line2"),
    t("landing.newHero.line3"),
  ] as [string, string, string];

  return (
    <section id="top" className="relative h-screen min-h-140 w-full overflow-hidden bg-[#021433] text-white font-sans">
      <SplashScreen onReveal={() => setSplashRevealed(true)} />
      <h1 className="sr-only">{headlineLines.join(" ")}</h1>
      <WebGLCanvas
        headlineLines={headlineLines}
        onFontsReady={() => setFontsReady(true)}
        impulseTriggerRef={impulseTriggerRef}
      />
      <HeroCtas language={language} onStartClick={handleStartClick} onDemoClick={handleDemoClick} />
      <HeroHeader
        activeNav={activeNav}
        onSelectNav={handleSelectNav}
        onLogoClick={handleLogoClick}
        language={language}
        onChangeLanguage={setLanguage}
        onTryClick={handleStartClick}
        ready={heroReady}
      />
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-end px-4 pb-4 md:px-6 md:pb-5.5 lg:px-9 lg:pb-7">
        <HeroFooter ready={heroReady} language={language} onScrollClick={handleScrollClick} />
      </div>
    </section>
  );
}

export { Hero as FancyHero };
