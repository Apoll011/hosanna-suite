import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { LanguageCode } from './LanguageToggle';

interface HeroCtasProps {
  language: LanguageCode;
  onStartClick: () => void;
  onDemoClick: () => void;
}

const CTA_COPY: Record<LanguageCode, { start: string; demo: string }> = {
  pt: { start: 'Começar Agora', demo: 'Ver Demo' },
  en: { start: 'Get Started', demo: 'Watch Demo' },
  es: { start: 'Empezar Ahora', demo: 'Ver Demo' },
};

export default function HeroCtas({ language, onStartClick, onDemoClick }: HeroCtasProps) {
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [primaryPressed, setPrimaryPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const copy = CTA_COPY[language];

  const hoverScale = reduceMotion ? {} : { scale: 1.045, y: -1.5 };
  const restScale = { scale: 1, y: 0 };
  const tapScale = reduceMotion ? {} : { scale: 0.985, y: 0 };
  const springTransition = reduceMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 420, damping: 26, mass: 0.7 };

  const sizeClasses =
    'inline-flex items-center justify-center rounded-full h-[38px] md:h-[44px] px-6 md:px-12 min-w-[208px] md:min-w-[244px] gap-2 md:gap-2.5 text-[12px] md:text-[13px] font-semibold tracking-[0.01em] leading-none whitespace-nowrap shrink-0 cursor-pointer select-none';

  const primaryMotionTarget = primaryPressed
    ? tapScale
    : primaryHovered
      ? hoverScale
      : restScale;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(43.5%+clamp(32px,6.1vw,98px)*1.62+38px)] md:top-[calc(43.5%+clamp(32px,6.1vw,98px)*1.62+68px)] flex justify-center px-[22px]">
      <div className="pointer-events-auto flex flex-col md:flex-row items-center justify-center gap-3.5 md:gap-4">
        {/* Primary CTA: White pill with mix-blend-screen negative-space text & arrow revealing live WebGL bg */}
        <div className="relative inline-flex">
          {/* Outer-only subtle floating drop shadow synced with button scale without isolating blend context */}
          <motion.div
            aria-hidden="true"
            animate={primaryMotionTarget}
            transition={springTransition}
            className={`pointer-events-none absolute inset-0 rounded-full bg-transparent transition-shadow duration-200 ${
              primaryHovered
                ? 'shadow-[0_12px_26px_-6px_rgba(2,14,40,0.48),0_4px_10px_-2px_rgba(0,0,0,0.26)]'
                : 'shadow-[0_6px_18px_-4px_rgba(2,14,40,0.36),0_2px_6px_-2px_rgba(0,0,0,0.2)]'
            }`}
          />
          <motion.button
            type="button"
            onClick={onStartClick}
            onMouseEnter={() => setPrimaryHovered(true)}
            onMouseLeave={() => {
              setPrimaryHovered(false);
              setPrimaryPressed(false);
            }}
            onFocus={() => setPrimaryHovered(true)}
            onBlur={() => {
              setPrimaryHovered(false);
              setPrimaryPressed(false);
            }}
            onPointerDown={() => setPrimaryPressed(true)}
            onPointerUp={() => setPrimaryPressed(false)}
            onPointerCancel={() => setPrimaryPressed(false)}
            animate={primaryMotionTarget}
            transition={springTransition}
            className={`${sizeClasses} relative mix-blend-screen bg-white text-black border border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
          >
            <span>{copy.start}</span>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="w-[13px] h-[13px] md:w-[14px] md:h-[14px] shrink-0"
            >
              <path
                d="M3.25 8H12.75M12.75 8L8.75 4M12.75 8L8.75 12"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </div>

        {/* Secondary CTA: Transparent frosted pill with white text & sideways play triangle */}
        <motion.button
          type="button"
          onClick={onDemoClick}
          whileHover={hoverScale}
          whileTap={tapScale}
          transition={springTransition}
          className={`${sizeClasses} bg-white/[0.1] border border-white/40 backdrop-blur-[6px] text-white shadow-[0_6px_18px_-4px_rgba(2,14,40,0.36),0_2px_6px_-2px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_26px_-6px_rgba(2,14,40,0.48),0_4px_10px_-2px_rgba(0,0,0,0.26)] transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
        >
          <span>{copy.demo}</span>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="w-[11px] h-[11px] md:w-[12px] md:h-[12px] shrink-0"
          >
            <path d="M7.2 5.45c0-1.08 1.18-1.74 2.1-1.18l10.2 6.2c.89.54.89 1.82 0 2.36l-10.2 6.2c-.92.56-2.1-.1-2.1-1.18V5.45z" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
