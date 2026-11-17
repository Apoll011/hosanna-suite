import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const SEG_EASE = "cubic-bezier(0.77, 0, 0.175, 1)";
const WARP = 0.6;

const SIZES = {
  sm: {
    button: "h-6 px-2.25 text-[9px]",
    iconWrap: "w-2.25 h-2.25",
    gapClass: "mr-1",
    shiftClass: "-translate-x-3.25",
    rightAnchor: "right-2.25",
    wave: "w-2 h-2",
  },
  md: {
    button: "h-7 lg:h-8 px-2.75 lg:px-3.75 text-[9.5px] lg:text-[10.5px]",
    iconWrap: "w-2.5 h-2.5 lg:w-3 lg:h-3",
    gapClass: "mr-1.25 lg:mr-1.75",
    shiftClass: "-translate-x-3.75 lg:-translate-x-4.75",
    rightAnchor: "right-2.75 lg:right-3.75",
    wave: "w-2.25 h-2.25 lg:w-2.75 lg:h-2.75",
  },
} as const;

const passOffset = (k: number, passes: number) =>
  1 - Math.pow(1 - (k + 2 / 3) / (passes + 1), WARP);

const ringKeyframes = (
  from: number,
  amplitude: number,
  passes: number,
  decay: number,
): Keyframe[] => {
  const frames: Keyframe[] = [{ transform: `rotate(${from}deg)`, offset: 0, easing: SEG_EASE }];
  for (let k = 0; k < passes; k++) {
    const angle = amplitude * Math.pow(1 - k / passes, decay) * (k % 2 ? 1 : -1);
    frames.push({
      transform: `rotate(${angle.toFixed(2)}deg)`,
      offset: passOffset(k, passes),
      easing: SEG_EASE,
    });
  }
  frames.push({ transform: "rotate(0deg)", offset: 1 });
  return frames;
};

const liveAngle = (el: HTMLElement) => {
  const tf = getComputedStyle(el).transform;
  if (!tf || tf === "none") return 0;
  const m = new DOMMatrix(tf);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
};

interface TryPlayButtonProps {
  label: string;
  onClick: () => void;
  size?: "sm" | "md";
  ringAmplitude?: number;
  ringPasses?: number;
  ringDecay?: number;
  ringDuration?: number;
  waves?: boolean;
  className?: string;
}

function PlayTriangleSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M7.2 5.45c0-1.08 1.18-1.74 2.1-1.18l10.2 6.2c.89.54.89 1.82 0 2.36l-10.2 6.2c-.92.56-2.1-.1-2.1-1.18V5.45z" />
    </svg>
  );
}

export default function TryPlayButton({
  label,
  onClick,
  size = "md",
  ringAmplitude = 18,
  ringPasses = 5,
  ringDecay = 1,
  ringDuration = 820,
  waves = true,
  className = "",
}: TryPlayButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();

  const rightGlyphRef = useRef<HTMLSpanElement>(null);
  const waveLeftRef = useRef<SVGSVGElement>(null);
  const waveRightRef = useRef<SVGSVGElement>(null);

  const dims = SIZES[size];

  const triggerRightSwing = useCallback(() => {
    if (reduceMotion) return;
    const el = rightGlyphRef.current;
    if (!el) return;

    const enterDelay = 110;
    el.getAnimations().forEach((a) => a.cancel());
    el.animate(ringKeyframes(liveAngle(el), ringAmplitude, ringPasses, ringDecay), {
      duration: ringDuration,
      delay: enterDelay,
      easing: "linear",
    });

    if (!waves) return;
    for (let k = 0; k < ringPasses; k++) {
      const side = k % 2 ? waveRightRef.current : waveLeftRef.current;
      if (!side) continue;
      side.getAnimations().forEach((a) => a.cancel());
      const strength = Math.pow(1 - k / ringPasses, ringDecay);
      side.animate(
        [
          { opacity: 0, transform: "scale(0.55)" },
          { opacity: 0.9 * strength, offset: 0.3 },
          { opacity: 0, transform: "scale(1.25)" },
        ],
        {
          duration: 380,
          delay: enterDelay + passOffset(k, ringPasses) * ringDuration,
          easing: "ease-out",
        },
      );
    }
  }, [reduceMotion, ringAmplitude, ringDecay, ringDuration, ringPasses, waves]);

  useLayoutEffect(() => {
    const glyph = rightGlyphRef.current;
    const left = waveLeftRef.current;
    const right = waveRightRef.current;
    return () => {
      glyph?.getAnimations().forEach((a) => a.cancel());
      left?.getAnimations().forEach((a) => a.cancel());
      right?.getAnimations().forEach((a) => a.cancel());
    };
  }, []);

  const handleEnter = () => {
    setHovered(true);
    triggerRightSwing();
  };

  const handleLeave = () => {
    setHovered(false);
    setPressed(false);
  };

  const slideTransition = reduceMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 360, damping: 28, mass: 0.8 };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      animate={{ scale: pressed && !reduceMotion ? 0.97 : 1 }}
      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className={`relative overflow-hidden inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.08em] leading-none whitespace-nowrap shrink-0 cursor-pointer select-none touch-manipulation transition-[background-color,color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
        dims.button
      } ${
        hovered
          ? "mix-blend-normal bg-white/12 text-white border-white/40"
          : "mix-blend-screen bg-white text-black border-white"
      } ${className}`}
    >
      {/* Resting left play triangle (slides out to left on hover) */}
      <motion.span
        aria-hidden="true"
        animate={{
          x: hovered ? -22 : 0,
          opacity: hovered ? 0 : 1,
          scale: hovered ? 0.75 : 1,
        }}
        transition={slideTransition}
        className={`inline-grid place-items-center shrink-0 ${dims.iconWrap} ${dims.gapClass}`}
      >
        <PlayTriangleSvg />
      </motion.span>

      {/* Label glides smoothly into left padding slot while right triangle enters */}
      <span
        className={`inline-grid transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hovered ? dims.shiftClass : "translate-x-0"
        }`}
      >
        <span
          className={`col-start-1 row-start-1 transition-[opacity,filter] duration-200 ${
            hovered ? "opacity-0 blur-[1.5px]" : "opacity-100 blur-0"
          }`}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className={`col-start-1 row-start-1 transition-[opacity,filter] duration-200 ${
            hovered ? "opacity-100 blur-0" : "opacity-0 blur-[1.5px]"
          }`}
        >
          {label}
        </span>
      </span>

      {/* Hover right play triangle (emerges from the right edge of the pill, then shakes + emits waves) */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{
          x: hovered ? 0 : 24,
          opacity: hovered ? 1 : 0,
        }}
        transition={slideTransition}
        className={`pointer-events-none absolute inset-y-0 my-auto ${dims.rightAnchor} inline-grid place-items-center ${dims.iconWrap}`}
      >
        <span
          ref={rightGlyphRef}
          className="inline-grid place-items-center w-full h-full origin-center"
        >
          <PlayTriangleSvg />
        </span>

        {waves && (
          <>
            <svg
              ref={waveLeftRef}
              viewBox="0 0 14 14"
              strokeWidth="1.7"
              strokeLinecap="round"
              className={`pointer-events-none absolute -top-0.75 right-[calc(100%-2px)] opacity-0 fill-none stroke-current origin-bottom-right ${dims.wave}`}
            >
              <path d="M14 8a6 6 0 0 0-6 6" />
              <path d="M14 4A10 10 0 0 0 4 14" />
            </svg>
            <svg
              ref={waveRightRef}
              viewBox="0 0 14 14"
              strokeWidth="1.7"
              strokeLinecap="round"
              className={`pointer-events-none absolute -top-0.75 left-[calc(100%-2px)] opacity-0 fill-none stroke-current origin-bottom-left ${dims.wave}`}
            >
              <path d="M0 8a6 6 0 0 1 6 6" />
              <path d="M0 4a10 10 0 0 1 10 10" />
            </svg>
          </>
        )}
      </motion.span>
    </motion.button>
  );
}
