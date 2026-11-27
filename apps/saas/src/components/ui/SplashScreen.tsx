// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface SplashScreenProps {
  ready: boolean;
  onReveal?: () => void;
  fallbackTimeoutMs?: number;
}

const SESSION_KEY = "hosanna_splash_seen";

const hasSeenSplash = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "true";
  } catch {
    return false;
  }
};

export default function SplashScreen({
  ready,
  onReveal,
  fallbackTimeoutMs = 2500,
}: SplashScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const [destroyed, setDestroyed] = useState(() => hasSeenSplash());
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const revealedRef = useRef(false);
  const breatheTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (hasSeenSplash() || prefersReducedMotion) {
      if (!revealedRef.current) {
        revealedRef.current = true;
        (window as Window & { __hosannaSplashRevealed?: boolean }).__hosannaSplashRevealed = true;
        window.dispatchEvent(new Event("hosanna:splash-revealed"));
        onRevealRef.current?.();
      }
      setDestroyed(true);
      return;
    }

    try {
      window.sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      /* ignore */
    }

    const container = containerRef.current;
    const brand = brandRef.current;
    if (!container || !brand) return;

    const enterTween = gsap.fromTo(
      brand,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
    );

    const breatheTween = gsap.to(brand, {
      scale: 1.018,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.5,
    });
    breatheTweenRef.current = breatheTween;

    return () => {
      enterTween.kill();
      breatheTween.kill();
      breatheTweenRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (destroyed || revealedRef.current) return;

    const triggerReveal = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      (window as Window & { __hosannaSplashRevealed?: boolean }).__hosannaSplashRevealed = true;
      window.dispatchEvent(new Event("hosanna:splash-revealed"));
      onRevealRef.current?.();

      const container = containerRef.current;
      if (!container) {
        setDestroyed(true);
        return;
      }

      gsap.to(container, {
        opacity: 0,
        duration: 0.45,
        ease: "power2.inOut",
        onComplete: () => {
          breatheTweenRef.current?.kill();
          setDestroyed(true);
        },
      });
    };

    if (ready) {
      triggerReveal();
      return;
    }

    const fallbackTimer = window.setTimeout(triggerReveal, fallbackTimeoutMs);
    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [ready, destroyed, fallbackTimeoutMs]);

  if (destroyed) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#021433] select-none pointer-events-auto"
      aria-label="Hosanna Studio loading screen"
      role="status"
    >
      <div
        ref={brandRef}
        className="inline-flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 will-change-transform"
      >
        <img
          src="/assets/logo_icon.png"
          alt=""
          aria-hidden="true"
          className="h-3.5 sm:h-4.5 md:h-6 lg:h-7 w-auto block shrink-0 select-none"
          draggable={false}
        />
        <span
          aria-hidden="true"
          className="w-px h-2.5 sm:h-3 md:h-4 lg:h-4.5 bg-white/50 shrink-0"
        />
        <img
          src="/assets/wordmark_studio.svg"
          alt="Hosanna Studio"
          className="h-1.75 sm:h-2.25 md:h-3 lg:h-3.5 w-auto block shrink-0 select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
