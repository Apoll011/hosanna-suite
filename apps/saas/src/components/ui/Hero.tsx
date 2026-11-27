// SPDX-License-Identifier: AGPL-3.0-only
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import HeroCtas from "./HeroCtas";
import HeroFooter from "./HeroFooter";
import HeroHeader, { type NavItem } from "./HeroHeader";
import SplashScreen from "./SplashScreen";
import WebGLCanvas from "./WebGLCanvas";

const dashboardUrl = `${import.meta.env.VITE_DASHBOARD_URL}/new`;

export function useHeroSetup() {
  const { t } = useI18n();
  const [canvasReady, setCanvasReady] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
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

  useEffect(() => {
    let cancelled = false;

    const waitForEagerImages = () => {
      const eagerImages = Array.from(document.images).filter((img) => img.loading !== "lazy");
      return Promise.all(
        eagerImages.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const done = () => {
              img.removeEventListener("load", done);
              img.removeEventListener("error", done);
              resolve();
            };
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          });
        }),
      );
    };

    Promise.all([document.fonts.ready.catch(() => undefined), waitForEagerImages()]).then(() => {
      if (!cancelled) {
        setAssetsReady(true);
      }
    });

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) {
        setAssetsReady(true);
        setCanvasReady(true);
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  const contentReady = canvasReady && assetsReady;
  const heroReady = contentReady && splashRevealed;

  const headlineLines = [
    t("landing.newHero.line1"),
    t("landing.newHero.line2"),
    t("landing.newHero.line3"),
  ] as [string, string, string];

  return {
    headlineLines,
    contentReady,
    heroReady,
    onCanvasReady: useCallback(() => setCanvasReady(true), []),
    onSplashReveal: useCallback(() => setSplashRevealed(true), []),
    impulseTriggerRef,
  };
}

export default function Hero({ setup }: { setup?: ReturnType<typeof useHeroSetup> }) {
  const { language, setLanguage } = useI18n();
  const [activeNav, setActiveNav] = useState<NavItem>("features");
  const internalSetup = useHeroSetup();
  const {
    headlineLines,
    contentReady,
    heroReady,
    onCanvasReady,
    onSplashReveal,
    impulseTriggerRef,
  } = setup ?? internalSetup;

  const navigate = useNavigate();

  const handleSelectNav = useCallback(
    (item: NavItem) => {
      setActiveNav(item);
      if (item === "chordpro" || item === "about" || item === "contact") {
        navigate({ to: `/${item}`, viewTransition: true });
        return;
      }
      const targetId = item === "price" ? "pricing" : "features";
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
      });
      window.history.pushState(null, "", `/#${targetId}`);
      impulseTriggerRef.current?.();
    },
    [navigate],
  );

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

  return (
    <section
      id="top"
      data-bg-theme="blue"
      className="relative h-screen min-h-140 w-full overflow-hidden bg-transparent text-white font-sans"
    >
      <SplashScreen ready={contentReady} onReveal={onSplashReveal} />
      <h1 className="sr-only">{headlineLines.join(" ")}</h1>
      {!setup && (
        <WebGLCanvas
          headlineLines={headlineLines}
          ready={heroReady}
          onFontsReady={onCanvasReady}
          impulseTriggerRef={impulseTriggerRef}
        />
      )}
      <HeroCtas
        ready={heroReady}
        language={language}
        onStartClick={handleStartClick}
        onDemoClick={handleDemoClick}
      />
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
