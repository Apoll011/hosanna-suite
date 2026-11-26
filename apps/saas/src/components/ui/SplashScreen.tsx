// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface SplashScreenProps {
  onReveal?: () => void;
  durationMs?: number;
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

export default function SplashScreen({ onReveal, durationMs = 3000 }: SplashScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const [destroyed, setDestroyed] = useState(() => hasSeenSplash());
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (hasSeenSplash() || prefersReducedMotion) {
      onRevealRef.current?.();
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

    // Initial polish: soft entrance for brand identity
    gsap.fromTo(
      brand,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.75, ease: "power2.out" },
    );

    // Subtle ambient breathing during the hold
    const breatheTween = gsap.to(brand, {
      scale: 1.018,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.75,
    });

    // At the 4-second mark, smoothly fade out and trigger the hero reveal
    const timer = setTimeout(() => {
      onRevealRef.current?.();

      gsap.to(container, {
        opacity: 0,
        duration: 0.65,
        ease: "power2.inOut",
        onComplete: () => {
          breatheTween.kill();
          setDestroyed(true);
        },
      });
    }, durationMs);

    return () => {
      clearTimeout(timer);
      breatheTween.kill();
    };
  }, [durationMs]);

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
