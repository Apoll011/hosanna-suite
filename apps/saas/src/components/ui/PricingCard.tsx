// SPDX-License-Identifier: AGPL-3.0-only
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useRef } from "react";
import "./PricingCard.css";

interface Spring {
  x: number;
  v: number;
  t: number;
  k: number;
  c: number;
}

interface DigitColumn {
  colEl: HTMLSpanElement;
  stripEl: HTMLSpanElement;
  y: Spring;
  w: Spring;
  o: Spring;
}

export interface PricingCardProps {
  annual: boolean;
  onChangeAnnual: (annual: boolean) => void;
  price: number;
  unit: string;
  monthlyLabel: string;
  annualLabel: string;
  discountBadge: string;
  planDescription: string;
  billingNote: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  freeTrialLabel: string;
}

const DIGIT_HEIGHT = 56;
const MAX_DIGITS = 3;
const DIGIT_WIDTH_EM = 0.62;

const createSpring = (x: number, k = 400, c = 30): Spring => ({ x, v: 0, t: x, k, c });
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function PricingCard({
  annual,
  onChangeAnnual,
  price,
  unit,
  monthlyLabel,
  annualLabel,
  discountBadge,
  planDescription,
  billingNote,
  features,
  ctaLabel,
  ctaHref,
  freeTrialLabel,
}: PricingCardProps) {
  const hlRef = useRef<HTMLSpanElement>(null);
  const monthBtnRef = useRef<HTMLButtonElement>(null);
  const yearBtnRef = useRef<HTMLButtonElement>(null);
  const saveRef = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const billRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const engineRef = useRef<{
    setMode: (isAnnual: boolean) => void;
    setPrice: (val: number) => void;
    setBill: (text: string) => void;
    pressCta: (pressed: boolean) => void;
    syncHighlight: () => void;
  } | null>(null);

  useEffect(() => {
    const hlEl = hlRef.current;
    const monthBtn = monthBtnRef.current;
    const yearBtn = yearBtnRef.current;
    const saveEl = saveRef.current;
    const numEl = numRef.current;
    const billEl = billRef.current;
    const ctaEl = ctaRef.current;

    if (!hlEl || !monthBtn || !yearBtn || !saveEl || !numEl || !billEl || !ctaEl) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tune = (s: Spring, k: number, c: number) => {
      s.k = k;
      s.c = reduce ? 2 * Math.sqrt(k) : c;
    };
    const step = (s: Spring, dt: number) => {
      const a = -s.k * (s.x - s.t) - s.c * s.v;
      s.v += a * dt;
      s.x += s.v * dt;
    };

    const initialBtn = annual ? yearBtn : monthBtn;
    const initL = initialBtn.offsetLeft;
    const initR = initL + initialBtn.offsetWidth;

    const L = createSpring(initL, 480, 28);
    const R = createSpring(initR, 320, 26);
    const SV = createSpring(annual ? 1 : 0, 520, 22);
    const CP = createSpring(1, 520, 16);
    const BT = createSpring(1, 360, 26);

    tune(L, 480, 28);
    tune(R, 320, 26);
    tune(SV, 520, 22);
    tune(CP, 520, 16);
    tune(BT, 360, 26);

    numEl.replaceChildren();
    const digits: DigitColumn[] = Array.from({ length: MAX_DIGITS }, () => {
      const colEl = document.createElement("span");
      colEl.className = "rc";
      const stripEl = document.createElement("span");
      stripEl.className = "rs";
      for (let d = 0; d < 10; d++) {
        const i = document.createElement("i");
        i.textContent = String(d);
        stripEl.appendChild(i);
      }
      colEl.appendChild(stripEl);
      numEl.appendChild(colEl);

      const y = createSpring(0, 340, 26);
      const w = createSpring(DIGIT_WIDTH_EM, 340, 26);
      const o = createSpring(1, 340, 26);
      tune(y, 340, 26);
      tune(w, 340, 26);
      tune(o, 340, 26);
      return { colEl, stripEl, y, w, o };
    });

    const applyPriceTargets = (val: number, immediate: boolean) => {
      const str = String(Math.max(0, Math.round(val)));
      const pad = Math.max(0, MAX_DIGITS - str.length);
      for (let i = 0; i < MAX_DIGITS; i++) {
        const col = digits[i];
        if (i < pad) {
          col.w.t = 0;
          col.o.t = 0;
          if (immediate) {
            col.w.x = 0;
            col.o.x = 0;
          }
        } else {
          const d = Number(str[i - pad]) || 0;
          col.w.t = DIGIT_WIDTH_EM;
          col.o.t = 1;
          col.y.t = -d * DIGIT_HEIGHT;
          if (immediate) {
            col.w.x = DIGIT_WIDTH_EM;
            col.o.x = 1;
            col.y.x = col.y.t;
          }
        }
      }
    };

    applyPriceTargets(price, true);

    billEl.replaceChildren();
    let currentBillSpan = document.createElement("span");
    currentBillSpan.textContent = billingNote;
    billEl.appendChild(currentBillSpan);
    let outgoingBillSpan: HTMLSpanElement | null = null;
    let lastBillText = billingNote;
    let currentAnnual = annual;

    const setMode = (isAnnual: boolean) => {
      currentAnnual = isAnnual;
      const btn = isAnnual ? yearBtn : monthBtn;
      const targetL = btn.offsetLeft;
      const targetR = targetL + btn.offsetWidth;
      const movingRight = targetL > L.t;

      if (movingRight) {
        tune(R, 480, 28);
        tune(L, 320, 26);
      } else {
        tune(L, 480, 28);
        tune(R, 320, 26);
      }
      L.t = targetL;
      R.t = targetR;
      SV.t = isAnnual ? 1 : 0;
    };

    const setBill = (text: string) => {
      if (text === lastBillText) return;
      lastBillText = text;
      if (outgoingBillSpan && outgoingBillSpan.parentNode === billEl) {
        billEl.removeChild(outgoingBillSpan);
      }
      outgoingBillSpan = currentBillSpan;
      currentBillSpan = document.createElement("span");
      currentBillSpan.textContent = text;
      billEl.appendChild(currentBillSpan);
      BT.x = 0;
      BT.v = 0;
      BT.t = 1;
    };

    const syncHighlight = () => {
      const btn = currentAnnual ? yearBtn : monthBtn;
      const l = btn.offsetLeft;
      const r = l + btn.offsetWidth;
      L.x = L.t = l;
      R.x = R.t = r;
    };

    engineRef.current = {
      setMode,
      setPrice: (val) => applyPriceTargets(val, false),
      setBill,
      pressCta: (pressed) => {
        CP.t = pressed ? 0.96 : 1;
      },
      syncHighlight,
    };

    const frame = (dt: number) => {
      step(L, dt);
      step(R, dt);
      step(SV, dt);
      step(CP, dt);
      step(BT, dt);
      for (const col of digits) {
        step(col.y, dt);
        step(col.w, dt);
        step(col.o, dt);
      }
    };

    const render = () => {
      hlEl.style.transform = `translateX(${L.x.toFixed(2)}px)`;
      hlEl.style.width = `${Math.max(0, R.x - L.x).toFixed(2)}px`;

      const sv = Math.max(0, SV.x);
      saveEl.style.opacity = String(clamp(sv, 0, 1));
      saveEl.style.transform = `scale(${(0.75 + 0.25 * sv).toFixed(4)})`;

      for (const col of digits) {
        col.colEl.style.width = `${Math.max(0, col.w.x).toFixed(4)}em`;
        col.colEl.style.opacity = String(clamp(col.o.x, 0, 1));
        col.stripEl.style.transform = `translateY(${col.y.x.toFixed(2)}px)`;
      }

      const bt = clamp(BT.x, 0, 1);
      if (outgoingBillSpan) {
        outgoingBillSpan.style.opacity = String(clamp(1 - bt * 1.4, 0, 1));
        outgoingBillSpan.style.transform = `translateY(${(-bt * 18).toFixed(2)}px)`;
        if (bt >= 0.999 && outgoingBillSpan.parentNode === billEl) {
          billEl.removeChild(outgoingBillSpan);
          outgoingBillSpan = null;
        }
      }
      currentBillSpan.style.opacity = String(clamp(bt * 1.2, 0, 1));
      currentBillSpan.style.transform = `translateY(${((1 - bt) * 18).toFixed(2)}px)`;

      ctaEl.style.transform = `scale(${CP.x.toFixed(4)})`;
    };

    window.addEventListener("resize", syncHighlight);

    let rafId = 0;
    let last = performance.now();
    let disposed = false;

    const loop = (now: number) => {
      if (disposed) return;
      const rawDt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const subDt = rawDt / 4;
      for (let i = 0; i < 4; i++) {
        frame(subDt);
      }
      render();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      engineRef.current = null;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", syncHighlight);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine initializes once and receives updates via engineRef
  }, []);

  useEffect(() => {
    engineRef.current?.setMode(annual);
  }, [annual]);

  useEffect(() => {
    engineRef.current?.setPrice(price);
  }, [price]);

  useEffect(() => {
    engineRef.current?.setBill(billingNote);
  }, [billingNote]);

  useEffect(() => {
    engineRef.current?.syncHighlight();
  }, [monthlyLabel, annualLabel]);

  return (
    <div className="hosanna-plan-card shadow-2xl">
      <div className="seg" role="radiogroup" aria-label="Billing">
        <span ref={hlRef} className="hl" aria-hidden="true" />
        <button
          ref={monthBtnRef}
          type="button"
          role="radio"
          aria-checked={!annual}
          onClick={() => onChangeAnnual(false)}
        >
          {monthlyLabel}
        </button>
        <button
          ref={yearBtnRef}
          type="button"
          role="radio"
          aria-checked={annual}
          onClick={() => onChangeAnnual(true)}
        >
          {annualLabel}
        </button>
      </div>

      <div className="p-6 sm:p-8 md:p-10">
        <div className="flex items-center justify-between gap-3">
          <div className="font-display text-4xl font-semibold md:text-5xl text-[#021433]">
            Hosanna
          </div>
          <span ref={saveRef} className="save" aria-hidden={!annual}>
            {discountBadge}
          </span>
        </div>
        <p className="mt-2 text-slate-500">{planDescription}</p>

        <div className="mt-8 flex items-baseline gap-1.5">
          <span
            ref={numRef}
            className="num font-display text-5xl sm:text-6xl font-semibold text-[#0284c7]"
            aria-label={`${price}€`}
          />
          <span className="font-display text-5xl sm:text-6xl font-semibold text-[#0284c7]">€</span>
          <span className="ml-1 text-slate-500">{unit}</span>
        </div>

        <div ref={billRef} className="roll-line mt-1 text-xs text-slate-400" aria-live="polite" />

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0284c7]" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <a
          ref={ctaRef}
          href={ctaHref}
          onPointerDown={() => engineRef.current?.pressCta(true)}
          onPointerUp={() => engineRef.current?.pressCta(false)}
          onPointerLeave={() => engineRef.current?.pressCta(false)}
          onPointerCancel={() => engineRef.current?.pressCta(false)}
          className="cta mt-10 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#021433] focus-visible:ring-offset-2"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>

        <p className="mt-3 text-center text-xs text-slate-400">{freeTrialLabel}</p>
      </div>
    </div>
  );
}
