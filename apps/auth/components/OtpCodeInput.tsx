// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

interface Spring {
  x: number;
  v: number;
  t: number;
  k: number;
  c: number;
}

interface BoxSprings {
  y: Spring;
  o: Spring;
  a: Spring;
}

export interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  verified?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
  verifiedLabel?: string;
}

function makeSpring(x: number, k: number, c: number, reducedMotion: boolean): Spring {
  return { x, v: 0, t: x, k, c: reducedMotion ? 2 * Math.sqrt(k) : c };
}

function stepSpring(s: Spring, dt: number) {
  const a = -s.k * (s.x - s.t) - s.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

const OUTER_RADIUS = 10;
const BOX_HEIGHT = 56;
const GAP_REST = 8;

export function OtpCodeInput({
  value,
  onChange,
  length = 6,
  verified = false,
  disabled = false,
  autoFocus = false,
  ariaLabel = "Verification code",
  verifiedLabel = "Verified",
}: OtpCodeInputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const digitRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const caretRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const okRef = useRef<HTMLDivElement | null>(null);

  const [isFocused, setIsFocused] = useState(false);

  const cleanValue = value.replace(/\D/g, "").slice(0, length);

  const stateRef = useRef({
    val: cleanValue,
    prevDigits: Array.from({ length }, (_, i) => cleanValue[i] ?? ""),
    verified,
    focused: false,
    clock: 0,
    width: 320,
    reducedMotion: false,
  });

  const springsRef = useRef<{
    boxes: BoxSprings[];
    merge: Spring;
    green: Spring;
  } | null>(null);

  if (!springsRef.current) {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stateRef.current.reducedMotion = reduced;
    springsRef.current = {
      boxes: Array.from({ length }, () => ({
        y: makeSpring(0, 520, 16, reduced),
        o: makeSpring(0, 400, 28, reduced),
        a: makeSpring(0, 300, 26, reduced),
      })),
      merge: makeSpring(0, 260, 24, reduced),
      green: makeSpring(0, 220, 28, reduced),
    };
  }

  useEffect(() => {
    const st = stateRef.current;
    const springs = springsRef.current;
    if (!springs) return;

    for (let i = 0; i < length; i++) {
      const nextChar = cleanValue[i] ?? "";
      const prevChar = st.prevDigits[i] ?? "";
      const b = springs.boxes[i];
      if (!b) continue;

      if (nextChar && nextChar !== prevChar) {
        b.y.x = st.reducedMotion ? 0 : -14;
        b.y.v = 0;
        b.o.x = st.reducedMotion ? 1 : 0;
        b.o.t = 1;
      } else if (!nextChar) {
        b.o.t = 0;
      }
      st.prevDigits[i] = nextChar;
    }
    st.val = cleanValue;
  }, [cleanValue, length]);

  useEffect(() => {
    stateRef.current.verified = verified;
    const springs = springsRef.current;
    if (!springs) return;

    if (!verified) {
      springs.merge.t = 0;
      springs.green.t = 0;
      return;
    }

    const t1 = window.setTimeout(() => {
      springs.merge.t = 1;
    }, 60);
    const t2 = window.setTimeout(() => {
      springs.green.t = 1;
    }, 320);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [verified]);

  useEffect(() => {
    stateRef.current.focused = isFocused;
  }, [isFocused]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (containerRef.current) {
        stateRef.current.width = containerRef.current.offsetWidth || 320;
      }
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let rafId = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const st = stateRef.current;
      const springs = springsRef.current;
      if (!springs) return;

      const sub = 4;
      const subDt = dt / sub;
      for (let k = 0; k < sub; k++) {
        st.clock += subDt;
        for (let i = 0; i < length; i++) {
          const b = springs.boxes[i];
          if (!b) continue;
          const isActive = st.focused && !st.verified && i === Math.min(st.val.length, length - 1);
          b.a.t = isActive ? 1 : 0;
          stepSpring(b.y, subDt);
          stepSpring(b.o, subDt);
          stepSpring(b.a, subDt);
        }
        stepSpring(springs.merge, subDt);
        stepSpring(springs.green, subDt);
      }

      const w = st.width;
      const bw = Math.min(48, (w - GAP_REST * (length - 1)) / length);
      const m = clamp(springs.merge.x, 0, 1.1);
      const mClamped = clamp(m, 0, 1);
      const gap = GAP_REST * (1 - mClamped);
      const total = bw * length + gap * (length - 1);
      const left0 = (w - total) / 2;
      const g = clamp(springs.green.x, 0, 1);

      for (let i = 0; i < length; i++) {
        const boxEl = boxRefs.current[i];
        const digitEl = digitRefs.current[i];
        const caretEl = caretRefs.current[i];
        const b = springs.boxes[i];
        if (!boxEl || !digitEl || !caretEl || !b) continue;

        boxEl.style.left = `${(left0 + i * (bw + gap)).toFixed(2)}px`;
        boxEl.style.width = `${(bw + (i < length - 1 ? GAP_REST * mClamped + 1 : 0)).toFixed(2)}px`;

        const innerR = OUTER_RADIUS * (1 - mClamped);
        boxEl.style.borderRadius =
          i === 0
            ? `${OUTER_RADIUS}px ${innerR.toFixed(2)}px ${innerR.toFixed(2)}px ${OUTER_RADIUS}px`
            : i === length - 1
              ? `${innerR.toFixed(2)}px ${OUTER_RADIUS}px ${OUTER_RADIUS}px ${innerR.toFixed(2)}px`
              : `${innerR.toFixed(2)}px`;

        const a = clamp(b.a.x, 0, 1);
        if (g > 0.01) {
          const pct = (g * 100).toFixed(1);
          boxEl.style.background = `color-mix(in srgb, var(--m3-success) ${pct}%, var(--m3-card))`;
          boxEl.style.borderColor = `color-mix(in srgb, var(--m3-success) ${pct}%, var(--m3-border))`;
          boxEl.style.boxShadow = "none";
        } else if (a > 0.01) {
          const bgPct = (a * 10).toFixed(1);
          const borderPct = (a * 100).toFixed(1);
          boxEl.style.background = `color-mix(in srgb, var(--m3-primary) ${bgPct}%, var(--m3-card))`;
          boxEl.style.borderColor = `color-mix(in srgb, var(--m3-primary) ${borderPct}%, var(--m3-border))`;
          boxEl.style.boxShadow = `0 0 0 2px color-mix(in srgb, var(--m3-primary) ${(a * 22).toFixed(1)}%, transparent)`;
        } else {
          boxEl.style.background = "";
          boxEl.style.borderColor = "";
          boxEl.style.boxShadow = "";
        }

        digitEl.style.opacity = (clamp(b.o.x, 0, 1) * (1 - g)).toFixed(3);
        digitEl.style.transform = `translateY(${b.y.x.toFixed(2)}px)`;

        const showCaret = a > 0.5 && !st.val[i] && (st.reducedMotion || (st.clock * 1.8) % 2 < 1.2);
        caretEl.style.opacity = showCaret ? "1" : "0";
      }

      if (okRef.current) {
        okRef.current.style.opacity = clamp(springs.green.x * 1.6 - 0.5, 0, 1).toFixed(3);
        okRef.current.style.transform = `translateY(${((1 - g) * 8).toFixed(2)}px)`;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [length]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled || verified) return;
    const next = e.target.value.replace(/\D/g, "").slice(0, length);
    onChange(next);
  };

  return (
    <div className="w-full max-w-[320px] mx-auto my-2">
      <div
        ref={containerRef}
        className="relative mx-auto select-none"
        style={{ height: `${BOX_HEIGHT}px` }}
      >
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              boxRefs.current[i] = el;
            }}
            aria-hidden="true"
            className="absolute top-0 grid place-items-center border border-m3-border bg-m3-card text-m3-text font-sans text-2xl font-semibold tabular-nums will-change-[transform,width,left]"
            style={{ height: `${BOX_HEIGHT}px`, borderRadius: `${OUTER_RADIUS}px` }}
          >
            <span
              ref={(el) => {
                digitRefs.current[i] = el;
              }}
              className="block will-change-[transform,opacity]"
            >
              {cleanValue[i] ?? ""}
            </span>
            <span
              ref={(el) => {
                caretRefs.current[i] = el;
              }}
              className="absolute left-1/2 top-4 -ml-px w-0.5 h-6 rounded-full bg-m3-primary opacity-0 pointer-events-none"
            />
          </div>
        ))}

        <div
          ref={okRef}
          aria-live="polite"
          className="absolute inset-0 flex items-center justify-center gap-2 font-sans text-[15px] font-semibold text-white dark:text-[#0b0d12] opacity-0 pointer-events-none"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-none stroke-current"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <span>{verifiedLabel}</span>
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          value={cleanValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          className="absolute inset-0 z-10 w-full h-full opacity-0 border-0 cursor-text caret-transparent text-base disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
