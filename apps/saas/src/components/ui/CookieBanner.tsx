// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";
import { Check, CircleDot, X } from "lucide-react";
import { syncAnalyticsWithConsent } from "@/lib/analytics";
import { setStoredConsent, useCookieConsent } from "@/lib/consent";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import "./CookieBanner.css";

interface Spring {
  x: number;
  v: number;
  t: number;
  k: number;
  c: number;
}

interface Crumb {
  el: HTMLElement;
  life: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
}

interface TimerItem {
  t: number;
  fn: () => void;
}

interface FlickState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface CookieEngineApi {
  accept: (label: string) => void;
  decline: (label: string) => void;
  measure: (animate?: boolean) => void;
}

const createSpring = (x: number, k = 400, c = 30): Spring => ({ x, v: 0, t: x, k, c });
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const ENTRANCE_DELAY_MS = 3000;

export function CookieBanner() {
  const { isOpen, hasChosen, close } = useCookieConsent();
  const { t, language } = useI18n();
  const [readyToShow, setReadyToShow] = useState(false);
  const [entered, setEntered] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const bannerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const cookieRef = useRef<SVGSVGElement>(null);
  const bitesRef = useRef<SVGGElement>(null);
  const crumbsRef = useRef<HTMLElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLSpanElement>(null);
  const tickRef = useRef<SVGPathElement>(null);
  const yesBtnRef = useRef<HTMLButtonElement>(null);
  const noBtnRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<CookieEngineApi | null>(null);
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    syncAnalyticsWithConsent();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setReadyToShow(false);
      setEntered(false);
      setDetailsOpen(false);
      setDismissing(false);
      return;
    }

    if (hasChosen) {
      setReadyToShow(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }

    let timer: number | undefined;
    let raf: number | undefined;

    const startDelay = () => {
      if (timer !== undefined) return;
      timer = window.setTimeout(() => {
        setReadyToShow(true);
        raf = requestAnimationFrame(() => setEntered(true));
      }, ENTRANCE_DELAY_MS);
    };

    const win = window as Window & { __hosannaSplashRevealed?: boolean };
    const isHomeWithPendingSplash =
      window.location.pathname === "/" &&
      !win.__hosannaSplashRevealed &&
      window.sessionStorage.getItem("hosanna_splash_seen") !== "true" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isHomeWithPendingSplash) {
      startDelay();
    } else {
      window.addEventListener("hosanna:splash-revealed", startDelay, { once: true });
    }

    return () => {
      window.removeEventListener("hosanna:splash-revealed", startDelay);
      if (timer !== undefined) window.clearTimeout(timer);
      if (raf !== undefined) cancelAnimationFrame(raf);
    };
  }, [isOpen, hasChosen]);

  useEffect(() => {
    if (!isOpen || !readyToShow) return;
    setDismissing(false);

    const bannerEl = bannerRef.current;
    const bodyEl = bodyRef.current;
    const cookieEl = cookieRef.current;
    const bitesG = bitesRef.current;
    const crumbsEl = crumbsRef.current;
    const doneEl = doneRef.current;
    const msgEl = msgRef.current;
    const tickEl = tickRef.current;
    const yesBtn = yesBtnRef.current;
    const noBtn = noBtnRef.current;

    if (
      !bannerEl ||
      !bodyEl ||
      !cookieEl ||
      !bitesG ||
      !crumbsEl ||
      !doneEl ||
      !msgEl ||
      !tickEl ||
      !yesBtn ||
      !noBtn
    ) {
      return;
    }

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

    const timers: TimerItem[] = [];
    const after = (sec: number, fn: () => void) => {
      const item: TimerItem = { t: sec, fn };
      timers.push(item);
      return item;
    };

    bitesG.replaceChildren();
    crumbsEl.replaceChildren();

    const BITES = [-42, 28, 196].map((a) => {
      const r = (a * Math.PI) / 180;
      const cx = 32 + Math.cos(r) * 30;
      const cy = 32 + Math.sin(r) * 30;
      const parts: [number, number, number][] = [[cx, cy, 13]];
      [-52, 0, 52].forEach((deg) => {
        const q = r + Math.PI + (deg * Math.PI) / 180;
        parts.push([cx + Math.cos(q) * 11.5, cy + Math.sin(q) * 11.5, 5.2]);
      });
      const els = parts.map(() =>
        bitesG.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "circle")),
      );
      const s = createSpring(0, 700, 22);
      tune(s, 700, 22);
      return { parts, els, s, x: cx, y: cy, a: r };
    });

    const crumbs: Crumb[] = Array.from({ length: 18 }, () => ({
      el: crumbsEl.appendChild(document.createElement("i")),
      life: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 0,
      vr: 0,
    }));
    let ci = 0;

    const M = createSpring(0, 260, 24);
    const WW = createSpring(0, 260, 24);
    const HH = createSpring(0, 230, 22);
    const CS = createSpring(1, 520, 16);
    const CR = createSpring(0, 190, 9);
    const CY = createSpring(0, 280, 22);
    const PY = createSpring(1, 520, 16);
    const PN = createSpring(1, 520, 16);
    const TK = createSpring(0, 160, 20);

    (
      [
        [M, [260, 24]],
        [WW, [260, 24]],
        [HH, [230, 22]],
        [CS, [520, 16]],
        [CR, [190, 9]],
        [CY, [280, 22]],
        [PY, [520, 16]],
        [PN, [520, 16]],
        [TK, [160, 20]],
      ] as [Spring, [number, number]][]
    ).forEach(([s, [k, c]]) => tune(s, k, c));

    let W0 = 0;
    let H0 = 0;
    let W1 = 0;
    let busy = false;
    let flick: FlickState | null = null;
    let disposed = false;

    const measure = (animate = false) => {
      if (busy) return;
      const w = bodyEl.offsetWidth;
      const h = bodyEl.offsetHeight;
      W0 = w;
      H0 = h;
      WW.t = w;
      HH.t = h;
      if (!animate) {
        WW.x = w;
        HH.x = h;
        bannerEl.style.width = `${w}px`;
        bannerEl.style.height = `${h}px`;
      }
    };

    const spray = (x: number, y: number, n: number, power: number) => {
      for (let i = 0; i < n; i++) {
        const c = crumbs[ci++ % crumbs.length];
        const a = Math.random() * Math.PI * 2;
        c.life = 0.75 + Math.random() * 0.35;
        c.x = x - 32;
        c.y = y - 32;
        c.vx = Math.cos(a) * power * (0.4 + Math.random());
        c.vy = -Math.abs(Math.sin(a)) * power * (0.6 + Math.random()) - 40;
        c.r = 0;
        c.vr = (Math.random() - 0.5) * 900;
      }
    };

    const bite = (i: number) => {
      const b = BITES[i];
      b.s.t = 1;
      CR.v += (i % 2 ? -1 : 1) * 520;
      CS.x = 0.86;
      spray(b.x, b.y, 5, 150);
    };

    const fold = (text: string, ok: boolean) => {
      msgEl.textContent = text;
      doneEl.classList.toggle("is-yes", ok);
      W1 = doneEl.offsetWidth;
      M.t = 1;
      WW.t = W1;
      HH.t = 44;
      TK.x = 0;
      TK.t = 0;
      after(0.28, () => {
        TK.t = 1;
      });
      after(1.8, () => {
        if (disposed) return;
        setDismissing(true);
        after(0.32, () => {
          if (!disposed) closeRef.current();
        });
      });
    };

    const accept = (label: string) => {
      if (busy) return;
      busy = true;
      PY.x = 0.92;
      [0, 1, 2].forEach((i) => after(0.1 + i * 0.27, () => bite(i)));
      after(0.1 + 3 * 0.27, () => {
        tune(CS, 600, 34);
        CS.t = 0;
        spray(32, 32, 6, 110);
      });
      after(1.2, () => {
        tune(CS, 520, 16);
        fold(label, true);
      });
    };

    const decline = (label: string) => {
      if (busy) return;
      busy = true;
      PN.x = 0.92;
      flick = { x: 0, y: 0, vx: -60, vy: 0 };
      after(0.8, () => fold(label, false));
    };

    engineRef.current = { accept, decline, measure };

    const frame = (dt: number) => {
      for (let i = timers.length - 1; i >= 0; i--) {
        timers[i].t -= dt;
        if (timers[i].t <= 0) {
          const fn = timers[i].fn;
          timers.splice(i, 1);
          fn();
        }
      }

      step(M, dt);
      step(WW, dt);
      step(HH, dt);
      step(CS, dt);
      step(CR, dt);
      step(CY, dt);
      step(PY, dt);
      step(PN, dt);
      step(TK, dt);

      for (const b of BITES) {
        step(b.s, dt);
      }

      if (flick) {
        flick.vx -= 620 * dt;
        if (flick.x < -46) flick.vy += 1500 * dt;
        flick.x += flick.vx * dt;
        flick.y += flick.vy * dt;
      }

      for (const c of crumbs) {
        if (c.life <= 0) continue;
        c.life -= dt;
        c.vy += 900 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.r += c.vr * dt;
      }
    };

    const render = () => {
      const m = clamp(M.x, 0, 1);
      bannerEl.style.width = `${Math.max(44, WW.x).toFixed(2)}px`;
      bannerEl.style.height = `${Math.max(44, HH.x).toFixed(2)}px`;
      bannerEl.style.borderRadius = `${Math.min(24, Math.max(44, HH.x) / 2).toFixed(2)}px`;
      bannerEl.style.overflow = M.t || m > 0.01 ? "hidden" : "visible";

      const bodyOpacity = clamp(1 - m * 2.2, 0, 1);
      bodyEl.style.opacity = String(bodyOpacity);
      bodyEl.style.pointerEvents = bodyOpacity < 0.1 ? "none" : "auto";
      bodyEl.style.transform = `translate(${((WW.x - W0) / 2).toFixed(1)}px,${((HH.x - H0) / 2).toFixed(1)}px)`;

      const d = clamp(m * 2.2 - 1.2, 0, 1);
      doneEl.style.opacity = String(d);
      doneEl.style.transform = `translate(-50%,-50%) translateY(${((1 - d) * 8).toFixed(2)}px)`;

      tickEl.style.strokeDashoffset = (1 - clamp(TK.x, 0, 1)).toFixed(4);

      for (const b of BITES) {
        const k = Math.max(0, b.s.x);
        for (let j = 0; j < b.parts.length; j++) {
          const [px, py, pr] = b.parts[j];
          const el = b.els[j];
          el.setAttribute("cx", String(px));
          el.setAttribute("cy", String(py));
          el.setAttribute("r", (pr * k).toFixed(2));
        }
      }

      for (const c of crumbs) {
        if (c.life <= 0) {
          c.el.style.opacity = "0";
          continue;
        }
        c.el.style.opacity = String(clamp(c.life * 2.4, 0, 1));
        c.el.style.transform = `translate(${(32 + c.x).toFixed(1)}px,${(32 + c.y).toFixed(1)}px) rotate(${c.r.toFixed(1)}deg)`;
      }

      const fx = flick ? flick.x : 0;
      const fy = flick ? flick.y : 0;
      cookieEl.style.transform = `translate(${fx.toFixed(2)}px,${(fy + CY.x).toFixed(2)}px) rotate(${(CR.x * 0.012 + fx / 28).toFixed(4)}rad) scale(${Math.max(0, CS.x).toFixed(4)})`;

      yesBtn.style.transform = `scale(${PY.x.toFixed(4)})`;
      noBtn.style.transform = `scale(${PN.x.toFixed(4)})`;
    };

    measure(false);
    const onResize = () => measure(false);
    window.addEventListener("resize", onResize);

    let rafId = 0;
    let last = performance.now();
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        closeRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      disposed = true;
      engineRef.current = null;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, readyToShow]);

  useEffect(() => {
    if (isOpen && readyToShow) {
      engineRef.current?.measure(true);
    }
  }, [isOpen, readyToShow, detailsOpen, language]);

  if (!isOpen || !readyToShow) return null;

  const handleAcceptAll = () => {
    setStoredConsent("all");
    syncAnalyticsWithConsent();
    engineRef.current?.accept(t("cookieConsent.acceptedConfirm"));
  };

  const handleEssentialOnly = () => {
    setStoredConsent("essential");
    syncAnalyticsWithConsent();
    engineRef.current?.decline(t("cookieConsent.essentialConfirm"));
  };

  return (
    <div
      role="region"
      aria-label={t("cookieConsent.title")}
      className={cn(
        "fixed z-50 pointer-events-none inset-x-0 bottom-0 p-3 sm:p-4 md:inset-x-auto md:left-5 md:bottom-5 md:p-0",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        ref={bannerRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-desc"
        className={cn(
          "hosanna-cookie-banner banner pointer-events-auto max-w-full font-sans",
          !entered && "is-entering",
          dismissing && "is-dismissing",
        )}
      >
        <div ref={bodyRef} className="body">
          <div className="top">
            <div className="plate">
              <svg ref={cookieRef} className="cookie" viewBox="0 0 64 64" aria-hidden="true">
                <defs>
                  <radialGradient id="cookie-dough" cx=".34" cy=".26" r=".86">
                    <stop className="d0" offset="0" />
                    <stop className="d1" offset=".5" />
                    <stop className="d2" offset="1" />
                  </radialGradient>
                  <radialGradient id="cookie-chip" cx=".36" cy=".3" r=".8">
                    <stop className="c0" offset="0" />
                    <stop className="c1" offset="1" />
                  </radialGradient>
                  <radialGradient id="cookie-dent" cx=".5" cy=".62" r=".6">
                    <stop className="n0" offset="0" />
                    <stop className="n1" offset="1" />
                  </radialGradient>
                  <mask
                    id="cookie-bites"
                    maskUnits="userSpaceOnUse"
                    x="-8"
                    y="-8"
                    width="80"
                    height="80"
                  >
                    <rect className="keep" x="-8" y="-8" width="80" height="80" />
                    <g ref={bitesRef} id="bites" />
                  </mask>
                </defs>
                <g mask="url(#cookie-bites)">
                  <circle className="edge" cx="32" cy="32" r="30" />
                  <circle className="dough" cx="32" cy="31.2" r="29" />
                  <ellipse className="dent" cx="14" cy="27" rx="3.2" ry="2.4" />
                  <ellipse className="dent" cx="34" cy="26" rx="2.6" ry="2" />
                  <ellipse className="dent" cx="50" cy="42" rx="2.8" ry="2.2" />
                  <ellipse className="dent" cx="27" cy="43" rx="2.2" ry="1.7" />
                  <g className="chips">
                    <circle cx="22" cy="19" r="4.4" />
                    <circle cx="41" cy="16" r="3.3" />
                    <circle cx="46" cy="31" r="4.2" />
                    <circle cx="30" cy="34" r="3.5" />
                    <circle cx="17" cy="38" r="3.1" />
                    <circle cx="38" cy="48" r="4.4" />
                    <circle cx="24" cy="51" r="2.7" />
                  </g>
                </g>
              </svg>
              <i ref={crumbsRef} className="crumbs" />
            </div>
            <div className="copy">
              <div className="flex items-start justify-between gap-2">
                <h2
                  id="cookie-banner-title"
                  className="text-sm font-semibold tracking-tight text-[#021433] leading-tight"
                >
                  {t("cookieConsent.title")}
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="shrink-0 -mr-1.5 -mt-1.5 p-1 rounded-lg text-slate-400 hover:text-[#021433] hover:bg-[#021433]/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#021433] cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p id="cookie-banner-desc" className="mt-1 text-xs leading-relaxed text-[#475569]">
                {t("cookieConsent.compactSummary")}{" "}
                <button
                  type="button"
                  onClick={() => setDetailsOpen((prev) => !prev)}
                  aria-expanded={detailsOpen}
                  className="inline font-medium text-[#021433] underline underline-offset-2 decoration-[#021433]/40 hover:decoration-[#021433] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#021433] rounded-xs"
                >
                  {detailsOpen ? t("cookieConsent.hideDetails") : t("cookieConsent.viewDetails")}
                </button>
              </p>
            </div>
          </div>

          {detailsOpen && (
            <ul className="mt-3 space-y-1.5 border-t border-[#021433]/10 pt-2.5 text-[11.5px] leading-snug text-[#475569]">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#34d17a]" aria-hidden="true" />
                <span>
                  <strong className="font-medium text-[#021433]">
                    {t("cookieConsent.essentialTitle")}
                  </strong>
                  : {t("cookieConsent.essentialShort")}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CircleDot className="h-3.5 w-3.5 shrink-0 text-[#14B8C4]" aria-hidden="true" />
                <span>
                  <strong className="font-medium text-[#021433]">
                    {t("cookieConsent.analyticsTitle")}
                  </strong>
                  : {t("cookieConsent.analyticsShort")}
                </span>
              </li>
            </ul>
          )}

          <div className="row">
            <button
              ref={noBtnRef}
              type="button"
              onClick={handleEssentialOnly}
              className="btn no focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#021433]"
            >
              {t("cookieConsent.essentialOnly")}
            </button>
            <button
              ref={yesBtnRef}
              type="button"
              onClick={handleAcceptAll}
              className="btn yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#021433] focus-visible:ring-offset-2"
            >
              {t("cookieConsent.acceptAnalytics")}
            </button>
          </div>
        </div>

        <div ref={doneRef} className="done" aria-live="polite">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path ref={tickRef} pathLength={1} d="M6 12.5l4 4 8-9" />
          </svg>
          <span ref={msgRef} />
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
