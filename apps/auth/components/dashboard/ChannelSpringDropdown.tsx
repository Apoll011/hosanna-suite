"use client";

import type { NotificationChannel } from "@/lib/services/notifications-api";
import { Bell, ChevronDown, Mail, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  clamp,
  createSpring,
  prefersReducedMotion,
  stepSpring,
  tuneSpring,
  type SpringState,
} from "./springMotion";

export type ChannelOption = {
  id: NotificationChannel;
  label: string;
  dotColor: string;
};

type ChannelSpringDropdownProps = {
  selected: NotificationChannel[];
  onChange: (next: NotificationChannel[]) => void;
  options: ChannelOption[];
  ariaLabel: string;
  allLabel: string;
};

const ROW_H = 38;
const MENU_PAD = 5;
const MENU_GAP = 6;

function channelIcon(id: NotificationChannel) {
  switch (id) {
    case "inbox":
      return <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden />;
    case "email":
      return <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />;
    case "push":
      return <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  }
}

export function ChannelSpringDropdown({
  selected,
  onChange,
  options,
  ariaLabel,
  allLabel,
}: ChannelSpringDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const trigRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const chevRef = useRef<SVGSVGElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const optRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tickRefs = useRef<(SVGPathElement | null)[]>([]);

  const menuHeight = MENU_PAD * 2 + ROW_H * options.length;
  const openRef = useRef(false);
  const hovRef = useRef(-1);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const springsRef = useRef<{
    H: SpringState;
    C: SpringState;
    O: SpringState;
    TS: SpringState;
    HT: SpringState;
    HB: SpringState;
    HO: SpringState;
    opts: { s: SpringState; k: SpringState }[];
  } | null>(null);

  if (!springsRef.current) {
    springsRef.current = {
      H: createSpring(0, 300, 23),
      C: createSpring(0, 300, 18),
      O: createSpring(0, 400, 34),
      TS: createSpring(1, 500, 18),
      HT: createSpring(MENU_PAD, 620, 36),
      HB: createSpring(MENU_PAD + ROW_H, 620, 36),
      HO: createSpring(0, 400, 32),
      opts: options.map((opt) => ({
        s: createSpring(0, 300, 24),
        k: createSpring(selected.includes(opt.id) ? 1 : 0, 260, 26),
      })),
    };
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const positionMenu = useCallback(() => {
    const trig = trigRef.current;
    const menu = menuRef.current;
    if (!trig || !menu) return;
    const rect = trig.getBoundingClientRect();
    const width = Math.max(176, rect.width);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const openUp = spaceBelow < menuHeight + MENU_GAP && rect.top > menuHeight + MENU_GAP;
    const left = clamp(rect.left, 8, window.innerWidth - width - 8);
    menu.style.width = `${width}px`;
    menu.style.left = `${left}px`;
    if (openUp) {
      menu.style.top = `${Math.max(8, rect.top - MENU_GAP - menuHeight)}px`;
      menu.style.transformOrigin = "50% 100%";
    } else {
      menu.style.top = `${rect.bottom + MENU_GAP}px`;
      menu.style.transformOrigin = "50% 0%";
    }
  }, [menuHeight]);

  useEffect(() => {
    const s = springsRef.current;
    if (!s) return;
    const reduced = prefersReducedMotion();
    options.forEach((opt, i) => {
      if (s.opts[i]) {
        tuneSpring(s.opts[i].k, 260, 26, reduced);
        s.opts[i].k.t = selected.includes(opt.id) ? 1 : 0;
      }
    });
  }, [selected, options]);

  const hoverIndex = useCallback(
    (idx: number, snap = false) => {
      const s = springsRef.current;
      if (!s || idx < 0 || idx >= options.length || idx === hovRef.current) return;
      const top = MENU_PAD + idx * ROW_H;
      const reduced = prefersReducedMotion();
      if (snap || hovRef.current < 0) {
        s.HT.x = s.HT.t = top;
        s.HB.x = s.HB.t = top + ROW_H;
        s.HT.v = s.HB.v = 0;
      } else {
        const down = idx > hovRef.current;
        tuneSpring(down ? s.HB : s.HT, 620, 36, reduced);
        tuneSpring(down ? s.HT : s.HB, 200, 20, reduced);
        s.HT.t = top;
        s.HB.t = top + ROW_H;
      }
      hovRef.current = idx;
      setHoveredIdx(idx);
      s.HO.t = 1;
    },
    [options.length],
  );

  useEffect(() => {
    const s = springsRef.current;
    if (!s) return;
    openRef.current = open;
    const reduced = prefersReducedMotion();
    tuneSpring(s.H, 300, 23, reduced);
    tuneSpring(s.C, 300, 18, reduced);
    tuneSpring(s.O, 400, 34, reduced);
    s.H.t = open ? menuHeight : 0;
    s.C.t = open ? 1 : 0;
    s.O.t = open ? 1 : 0;

    const timers: number[] = [];
    options.forEach((_, i) => {
      const delayMs = open ? 35 + i * 40 : (options.length - 1 - i) * 20;
      const id = window.setTimeout(() => {
        if (s.opts[i]) s.opts[i].s.t = openRef.current ? 1 : 0;
      }, delayMs);
      timers.push(id);
    });

    if (open) {
      positionMenu();
      const firstSelected = options.findIndex((o) => selectedRef.current.includes(o.id));
      hoverIndex(firstSelected >= 0 ? firstSelected : 0, true);
    } else {
      hovRef.current = -1;
      setHoveredIdx(-1);
      s.HO.t = 0;
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [open, menuHeight, options, positionMenu, hoverIndex]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (trigRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScrollOrResize = () => positionMenu();
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, positionMenu]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const s = springsRef.current;
      if (!s) return;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const sub = 4;
      const stepDt = dt / sub;
      for (let k = 0; k < sub; k++) {
        stepSpring(s.H, stepDt);
        stepSpring(s.C, stepDt);
        stepSpring(s.O, stepDt);
        stepSpring(s.TS, stepDt);
        stepSpring(s.HT, stepDt);
        stepSpring(s.HB, stepDt);
        stepSpring(s.HO, stepDt);
        s.opts.forEach((o) => {
          stepSpring(o.s, stepDt);
          stepSpring(o.k, stepDt);
        });
      }

      if (trigRef.current) {
        trigRef.current.style.transform = `scale(${s.TS.x.toFixed(4)})`;
      }
      if (chevRef.current) {
        chevRef.current.style.transform = `rotate(${(180 * s.C.x).toFixed(2)}deg)`;
      }
      const menu = menuRef.current;
      if (menu) {
        const h = Math.max(0, s.H.x);
        const o = clamp(s.O.x, 0, 1);
        menu.style.height = `${h.toFixed(2)}px`;
        menu.style.opacity = o.toFixed(3);
        menu.style.visibility = h < 1 ? "hidden" : "visible";
        menu.style.pointerEvents = openRef.current ? "auto" : "none";
        menu.style.transform = `scaleX(${(0.92 + 0.08 * clamp(s.H.x / menuHeight, 0, 1.05)).toFixed(4)})`;
      }
      s.opts.forEach((o, i) => {
        const el = optRefs.current[i];
        if (el) {
          const op = clamp(o.s.x, 0, 1);
          el.style.opacity = op.toFixed(3);
          el.style.transform = `translateY(${((o.s.x - 1) * 12).toFixed(2)}px)`;
        }
        const path = tickRefs.current[i];
        if (path) {
          path.style.strokeDashoffset = (22 * (1 - clamp(o.k.x, 0, 1))).toFixed(2);
        }
      });
      if (hlRef.current) {
        const o = clamp(s.O.x, 0, 1);
        hlRef.current.style.opacity = (clamp(s.HO.x, 0, 1) * o).toFixed(3);
        const ht = clamp(Math.min(s.HT.x, s.HB.x - 14), MENU_PAD, menuHeight - MENU_PAD - 14);
        const hb = clamp(s.HB.x, ht + 14, menuHeight - MENU_PAD);
        hlRef.current.style.height = `${(hb - ht).toFixed(2)}px`;
        hlRef.current.style.transform = `translateY(${ht.toFixed(2)}px)`;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [menuHeight]);

  const toggleOption = (id: NotificationChannel) => {
    const s = springsRef.current;
    if (s) s.TS.x = 0.96;
    const exists = selected.includes(id);
    if (exists) {
      if (selected.length === 1) return;
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.id));
  const summaryLabel =
    selectedOptions.length === options.length
      ? allLabel
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions[0]?.label ?? ""} +${selectedOptions.length - 1}`;

  return (
    <>
      <button
        ref={trigRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (springsRef.current) springsRef.current.TS.x = 0.965;
          setOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) {
              setOpen(true);
            } else {
              const delta = e.key === "ArrowDown" ? 1 : -1;
              const next = (hoveredIdx + delta + options.length) % options.length;
              hoverIndex(next);
            }
          } else if ((e.key === "Enter" || e.key === " ") && open && hoveredIdx >= 0) {
            e.preventDefault();
            toggleOption(options[hoveredIdx].id);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
          }
        }}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-m3-border bg-m3-card px-2.5 text-xs font-medium text-m3-text shadow-xs transition-colors hover:bg-m3-hover focus-visible:outline-2 focus-visible:outline-m3-primary cursor-pointer select-none"
      >
        <span className="flex items-center -space-x-1">
          {selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className="h-2.5 w-2.5 rounded-full border border-m3-card"
              style={{ backgroundColor: opt.dotColor }}
              aria-hidden
            />
          ))}
        </span>
        <span className="truncate max-w-[110px]">{summaryLabel}</span>
        <ChevronDown ref={chevRef} className="h-3.5 w-3.5 text-m3-secondary shrink-0" aria-hidden />
      </button>

      {mounted
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              aria-multiselectable="true"
              aria-label={ariaLabel}
              className="fixed z-50 overflow-hidden rounded-xl border border-m3-border bg-m3-card shadow-lg"
              style={{ height: 0, opacity: 0, visibility: "hidden", padding: `${MENU_PAD}px` }}
            >
              <span
                ref={hlRef}
                aria-hidden
                className="pointer-events-none absolute left-[5px] right-[5px] top-0 rounded-lg bg-m3-hover"
                style={{ opacity: 0 }}
              />
              {options.map((opt, idx) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    ref={(el) => {
                      optRefs.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onPointerEnter={() => open && hoverIndex(idx)}
                    onPointerMove={() => open && hoverIndex(idx)}
                    onClick={() => toggleOption(opt.id)}
                    className="relative z-10 flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium text-m3-text cursor-pointer select-none"
                    style={{ height: `${ROW_H}px`, opacity: 0 }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: opt.dotColor }}
                      aria-hidden
                    />
                    <span className="text-m3-secondary">{channelIcon(opt.id)}</span>
                    <span className="flex-1 truncate">{opt.label}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0 text-m3-primary"
                      aria-hidden
                    >
                      <path
                        ref={(el) => {
                          tickRefs.current[idx] = el;
                        }}
                        d="M5 12.5l4.5 4.5L19 7.5"
                        style={{ strokeDasharray: 22, strokeDashoffset: isSelected ? 0 : 22 }}
                      />
                    </svg>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
