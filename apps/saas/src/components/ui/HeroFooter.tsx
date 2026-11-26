// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { LanguageCode } from "./HeroHeader";

interface HeroFooterProps {
  ready: boolean;
  language: LanguageCode;
  onScrollClick: () => void;
}

const FOOTER_BLOCKS: { title: string; subtitles: Record<LanguageCode, string> }[] = [
  {
    title: "Smart Songbook",
    subtitles: {
      pt: "Cifras ChordPro e tons instantâneos",
      en: "ChordPro charts & instant keys",
      es: "Cifrados ChordPro y tonos al instante",
    },
  },
  {
    title: "Service Flow",
    subtitles: {
      pt: "Escalas, equipes e deixas em um só lugar",
      en: "Schedules, teams & cues in one place",
      es: "Turnos, equipos y señales en un solo lugar",
    },
  },
  {
    title: "Hosanna Studio",
    subtitles: {
      pt: "Grátis para começar, feito para crescer",
      en: "Free to start, built to scale",
      es: "Gratis para empezar, hecho para crecer",
    },
  },
];

export default function HeroFooter({ ready, language, onScrollClick }: HeroFooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sy = window.scrollY || 0;
          const range = Math.max(window.innerHeight * 0.45, 200);
          const prog = Math.min(1, Math.max(0, sy / range));
          setScrollProgress(prog);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fast upward entrance animation (opposite of top header)
  useEffect(() => {
    if (!ready || !footerRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = footerRef.current.querySelectorAll("[data-footer-item]");

    if (prefersReducedMotion) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.42,
        stagger: 0.03,
        delay: 0.04,
        ease: "power3.out",
      },
    );

    return () => {
      tween.kill();
    };
  }, [ready]);

  // Mobile 3-second looping X-axis rotation across the 3 footer text blocks
  useEffect(() => {
    if (!ready) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeTl: gsap.core.Timeline | null = null;

    const intervalId = window.setInterval(() => {
      const card = mobileCardRef.current;
      if (!card || prefersReducedMotion) {
        setMobileIndex((prev) => (prev + 1) % FOOTER_BLOCKS.length);
        return;
      }

      activeTl?.kill();
      activeTl = gsap.timeline();
      activeTl
        .to(card, {
          rotationX: -90,
          opacity: 0,
          y: -3,
          duration: 0.28,
          ease: "power2.in",
          transformPerspective: 520,
          transformOrigin: "50% 50%",
        })
        .call(() => {
          setMobileIndex((prev) => (prev + 1) % FOOTER_BLOCKS.length);
        })
        .fromTo(
          card,
          {
            rotationX: 90,
            opacity: 0,
            y: 3,
            transformPerspective: 520,
            transformOrigin: "50% 50%",
          },
          {
            rotationX: 0,
            opacity: 1,
            y: 0,
            duration: 0.36,
            ease: "power3.out",
            clearProps: "transform",
          },
          "+=0.02",
        );
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      activeTl?.kill();
    };
  }, [ready]);

  // Continuous downward scroll arrow breathing loop
  useEffect(() => {
    if (!arrowRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const arrowTween = gsap.to(arrowRef.current, {
      y: 6,
      duration: 1.1,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    return () => {
      arrowTween.kill();
    };
  }, []);

  const currentMobileBlock = FOOTER_BLOCKS[mobileIndex];
  const footerScrollY = -scrollProgress * 48;
  const footerScrollOpacity = Math.max(0, 1 - scrollProgress * 1.35);

  return (
    <footer
      ref={footerRef}
      style={{
        transform: `translateY(${footerScrollY}px)`,
        opacity: footerScrollOpacity,
        transition: "transform 0.1s cubic-bezier(0,0,0.2,1), opacity 0.1s cubic-bezier(0,0,0.2,1)",
      }}
      className="w-full flex items-end justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:items-end font-sans pointer-events-none will-change-transform"
    >
      {/* Left spacer on desktop to keep the 3 descriptor blocks dead-center */}
      <div className="hidden md:block" aria-hidden="true" />

      {/* Mobile (< 768px): Bottom-left X-axis rotating loop across all 3 descriptor blocks */}
      <div
        data-footer-item
        className="md:hidden opacity-0 pointer-events-auto perspective-[520px] min-h-9.5 flex items-end"
      >
        <div ref={mobileCardRef} className="transform-3d will-change-transform">
          <p className="text-[13px] font-medium text-white leading-[1.35]">
            {currentMobileBlock.title}
          </p>
          <p className="text-[12px] font-normal text-[rgba(255,255,255,0.78)] leading-[1.35]">
            {currentMobileBlock.subtitles[language]}
          </p>
        </div>
      </div>

      {/* Desktop (>= 768px): Centered 3 blocks of text */}
      <div className="hidden md:flex items-end justify-center md:gap-8 lg:gap-16 pointer-events-auto">
        {FOOTER_BLOCKS.map((block) => (
          <div key={block.title} data-footer-item className="opacity-0">
            <p className="text-[13px] font-medium text-white leading-[1.35]">{block.title}</p>
            <p className="text-[12px] font-normal text-[rgba(255,255,255,0.78)] leading-[1.35]">
              {block.subtitles[language]}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom-right scroll arrow */}
      <div data-footer-item className="justify-self-end opacity-0 pointer-events-auto">
        <button
          type="button"
          onClick={onScrollClick}
          aria-label="Send kinetic ripple across canvas"
          className="flex items-end justify-center w-7 h-11 -mr-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/80 rounded-sm"
        >
          <svg
            ref={arrowRef}
            width="14"
            height="36"
            viewBox="0 0 14 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <line
              x1="7"
              y1="2"
              x2="7"
              y2="32.5"
              stroke="#FFFFFF"
              strokeOpacity="0.9"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M2.5 28.5L7 33.2L11.5 28.5"
              stroke="#FFFFFF"
              strokeOpacity="0.9"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </footer>
  );
}
