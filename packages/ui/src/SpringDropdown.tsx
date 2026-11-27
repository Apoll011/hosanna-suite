"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  clamp,
  createSpring,
  prefersReducedMotion,
  springPresets,
  stepSpring,
  tuneSpring,
  type SpringValue,
} from "./motion";

export type SpringDropdownOption<T extends string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  dotColor?: string;
};

type SpringDropdownBase<T extends string> = {
  options: readonly SpringDropdownOption<T>[];
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  startAdornment?: ReactNode;
};

export type SpringDropdownProps<T extends string> =
  | (SpringDropdownBase<T> & {
      mode: "multiple";
      selected: readonly T[];
      onChange: (selected: T[]) => void;
      allLabel: string;
    })
  | (SpringDropdownBase<T> & {
      mode: "single";
      selected: T;
      onChange: (selected: T) => void;
      allLabel?: never;
    });

const ROW_HEIGHT = 38;
const MENU_PADDING = 5;
const MENU_GAP = 6;

export function SpringDropdown<T extends string>(props: SpringDropdownProps<T>) {
  const { options, ariaLabel, className = "", disabled = false } = props;
  const listboxId = useId();
  const multiple = props.mode === "multiple";
  const selected = multiple ? props.selected : [props.selected];
  const selectedKey = selected.join("\u0000");
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const checkRefs = useRef<(SVGPathElement | null)[]>([]);
  const openRef = useRef(false);
  const hoveredIndexRef = useRef(-1);
  const selectedRef = useRef<T[]>([...selected]);
  selectedRef.current = [...selected];

  const menuHeight = MENU_PADDING * 2 + ROW_HEIGHT * options.length;
  const springsRef = useRef<{
    height: SpringValue;
    chevron: SpringValue;
    opacity: SpringValue;
    trigger: SpringValue;
    highlightTop: SpringValue;
    highlightBottom: SpringValue;
    highlightOpacity: SpringValue;
    options: { opacity: SpringValue; selected: SpringValue }[];
  } | null>(null);

  if (!springsRef.current) {
    springsRef.current = {
      height: createSpring(0, ...springPresets.menu),
      chevron: createSpring(0, 300, 18),
      opacity: createSpring(0, ...springPresets.feedback),
      trigger: createSpring(1, 500, 18),
      highlightTop: createSpring(MENU_PADDING, ...springPresets.highlightLead),
      highlightBottom: createSpring(MENU_PADDING + ROW_HEIGHT, ...springPresets.highlightLead),
      highlightOpacity: createSpring(0, ...springPresets.feedback),
      options: options.map((option) => ({
        opacity: createSpring(0, ...springPresets.surface),
        selected: createSpring(selected.includes(option.id) ? 1 : 0, 260, 26),
      })),
    };
  }

  const optionSprings = springsRef.current.options;
  while (optionSprings.length < options.length) {
    const index = optionSprings.length;
    const option = options[index];
    optionSprings.push({
      opacity: createSpring(0, ...springPresets.surface),
      selected: createSpring(option && selected.includes(option.id) ? 1 : 0, 260, 26),
    });
  }
  optionSprings.length = options.length;

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(176, rect.width);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const openUp = spaceBelow < menuHeight + MENU_GAP && rect.top > menuHeight + MENU_GAP;
    menu.style.width = `${width}px`;
    menu.style.left = `${clamp(rect.left, 8, window.innerWidth - width - 8)}px`;
    if (openUp) {
      menu.style.top = `${Math.max(8, rect.top - MENU_GAP - menuHeight)}px`;
      menu.style.transformOrigin = "50% 100%";
    } else {
      menu.style.top = `${rect.bottom + MENU_GAP}px`;
      menu.style.transformOrigin = "50% 0%";
    }
  }, [menuHeight]);

  useEffect(() => {
    const springs = springsRef.current;
    if (!springs) return;
    const reduced = prefersReducedMotion();
    options.forEach((option, index) => {
      const spring = springs.options[index]?.selected;
      if (!spring) return;
      tuneSpring(spring, 260, 26, reduced);
      spring.t = selectedRef.current.includes(option.id) ? 1 : 0;
    });
  }, [options, selectedKey]);

  const hoverIndex = useCallback(
    (index: number, snap = false) => {
      const springs = springsRef.current;
      if (!springs || index < 0 || index >= options.length || index === hoveredIndexRef.current) {
        return;
      }
      const top = MENU_PADDING + index * ROW_HEIGHT;
      const reduced = prefersReducedMotion();
      if (snap || hoveredIndexRef.current < 0) {
        springs.highlightTop.x = springs.highlightTop.t = top;
        springs.highlightBottom.x = springs.highlightBottom.t = top + ROW_HEIGHT;
        springs.highlightTop.v = springs.highlightBottom.v = 0;
      } else {
        const movingDown = index > hoveredIndexRef.current;
        tuneSpring(
          movingDown ? springs.highlightBottom : springs.highlightTop,
          ...springPresets.highlightLead,
          reduced,
        );
        tuneSpring(
          movingDown ? springs.highlightTop : springs.highlightBottom,
          ...springPresets.highlightTrail,
          reduced,
        );
        springs.highlightTop.t = top;
        springs.highlightBottom.t = top + ROW_HEIGHT;
      }
      hoveredIndexRef.current = index;
      setHoveredIndex(index);
      springs.highlightOpacity.t = 1;
    },
    [options.length],
  );

  useEffect(() => {
    const springs = springsRef.current;
    if (!springs) return;
    openRef.current = open;
    const reduced = prefersReducedMotion();
    tuneSpring(springs.height, ...springPresets.menu, reduced);
    tuneSpring(springs.chevron, 300, 18, reduced);
    tuneSpring(springs.opacity, 400, 34, reduced);
    springs.height.t = open ? menuHeight : 0;
    springs.chevron.t = open ? 1 : 0;
    springs.opacity.t = open ? 1 : 0;

    const timers = options.map((_, index) => {
      const delay = open ? 35 + index * 40 : (options.length - 1 - index) * 20;
      return window.setTimeout(() => {
        const spring = springs.options[index]?.opacity;
        if (spring) spring.t = openRef.current ? 1 : 0;
      }, delay);
    });

    if (open) {
      positionMenu();
      const firstSelected = options.findIndex((option) => selectedRef.current.includes(option.id));
      hoverIndex(firstSelected >= 0 ? firstSelected : 0, true);
    } else {
      hoveredIndexRef.current = -1;
      setHoveredIndex(-1);
      springs.highlightOpacity.t = 0;
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [hoverIndex, menuHeight, open, options, positionMenu]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onResizeOrScroll = () => positionMenu();
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll, true);
    };
  }, [open, positionMenu]);

  useEffect(() => {
    let frameId = 0;
    let lastTime = performance.now();
    const frame = (now: number) => {
      const springs = springsRef.current;
      if (!springs) return;
      const dt = Math.min((now - lastTime) / 1000, 1 / 30) / 4;
      lastTime = now;
      for (let index = 0; index < 4; index++) {
        stepSpring(springs.height, dt);
        stepSpring(springs.chevron, dt);
        stepSpring(springs.opacity, dt);
        stepSpring(springs.trigger, dt);
        stepSpring(springs.highlightTop, dt);
        stepSpring(springs.highlightBottom, dt);
        stepSpring(springs.highlightOpacity, dt);
        springs.options.forEach((option) => {
          stepSpring(option.opacity, dt);
          stepSpring(option.selected, dt);
        });
      }
      if (triggerRef.current) {
        triggerRef.current.style.transform = `scale(${springs.trigger.x.toFixed(4)})`;
      }
      if (chevronRef.current) {
        chevronRef.current.style.transform = `rotate(${(180 * springs.chevron.x).toFixed(2)}deg)`;
      }
      if (menuRef.current) {
        const height = Math.max(0, springs.height.x);
        menuRef.current.style.height = `${height.toFixed(2)}px`;
        menuRef.current.style.opacity = clamp(springs.opacity.x, 0, 1).toFixed(3);
        menuRef.current.style.visibility = height < 1 ? "hidden" : "visible";
        menuRef.current.style.pointerEvents = openRef.current ? "auto" : "none";
        menuRef.current.style.transform = `scaleX(${(0.92 + 0.08 * clamp(height / menuHeight, 0, 1.05)).toFixed(4)})`;
      }
      springs.options.forEach((option, index) => {
        const element = optionRefs.current[index];
        if (element) {
          element.style.opacity = clamp(option.opacity.x, 0, 1).toFixed(3);
          element.style.transform = `translateY(${((option.opacity.x - 1) * 12).toFixed(2)}px)`;
        }
        const check = checkRefs.current[index];
        if (check)
          check.style.strokeDashoffset = (22 * (1 - clamp(option.selected.x, 0, 1))).toFixed(2);
      });
      if (highlightRef.current) {
        const top = clamp(
          Math.min(springs.highlightTop.x, springs.highlightBottom.x - 14),
          MENU_PADDING,
          menuHeight - MENU_PADDING - 14,
        );
        const bottom = clamp(springs.highlightBottom.x, top + 14, menuHeight - MENU_PADDING);
        highlightRef.current.style.opacity = (
          clamp(springs.highlightOpacity.x, 0, 1) * clamp(springs.opacity.x, 0, 1)
        ).toFixed(3);
        highlightRef.current.style.height = `${(bottom - top).toFixed(2)}px`;
        highlightRef.current.style.transform = `translateY(${top.toFixed(2)}px)`;
      }
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [menuHeight]);

  const selectOption = (id: T) => {
    const springs = springsRef.current;
    if (springs) springs.trigger.x = 0.96;
    if (props.mode === "multiple") {
      const exists = props.selected.includes(id);
      if (exists && props.selected.length === 1) return;
      props.onChange(
        exists ? props.selected.filter((item) => item !== id) : [...props.selected, id],
      );
      return;
    }
    props.onChange(id);
    setOpen(false);
  };

  const selectedOptions = options.filter((option) => selected.includes(option.id));
  const summary =
    props.mode === "single"
      ? (selectedOptions[0]?.label ?? "")
      : selectedOptions.length === options.length
        ? props.allLabel
        : selectedOptions.length === 1
          ? selectedOptions[0].label
          : `${selectedOptions[0]?.label ?? ""} +${selectedOptions.length - 1}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={
          open && hoveredIndex >= 0 ? `${listboxId}-option-${hoveredIndex}` : undefined
        }
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (springsRef.current) springsRef.current.trigger.x = 0.965;
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) setOpen(true);
            else
              hoverIndex(
                (hoveredIndex + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
                  options.length,
              );
          } else if ((event.key === "Enter" || event.key === " ") && open && hoveredIndex >= 0) {
            event.preventDefault();
            selectOption(options[hoveredIndex].id);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className={`inline-flex h-8 min-w-0 items-center gap-2 rounded-lg border border-m3-border bg-m3-card px-2.5 text-xs font-medium text-m3-text shadow-xs transition-colors hover:bg-m3-hover focus-visible:outline-2 focus-visible:outline-m3-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none ${className}`}
      >
        {props.mode === "multiple" ? (
          <span className="flex shrink-0 items-center -space-x-1">
            {selectedOptions.map((option) => (
              <span
                key={option.id}
                className="h-2.5 w-2.5 rounded-full border border-m3-card"
                style={{ backgroundColor: option.dotColor }}
                aria-hidden
              />
            ))}
          </span>
        ) : selectedOptions[0]?.icon ? (
          <span className="flex shrink-0 items-center text-m3-secondary" aria-hidden>
            {selectedOptions[0].icon}
          </span>
        ) : selectedOptions[0]?.dotColor ? (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: selectedOptions[0].dotColor }}
            aria-hidden
          />
        ) : null}
        {props.startAdornment ? (
          <span className="flex shrink-0 items-center gap-1.5 text-m3-secondary" aria-hidden="true">
            {props.startAdornment}
          </span>
        ) : null}
        <span className="max-w-[140px] truncate">{summary}</span>
        <ChevronDown
          ref={chevronRef}
          className="h-3.5 w-3.5 shrink-0 text-m3-secondary"
          aria-hidden
        />
      </button>

      <div
        ref={menuRef}
        id={listboxId}
        role="listbox"
        aria-multiselectable={props.mode === "multiple" || undefined}
        aria-label={ariaLabel}
        className="fixed z-50 overflow-hidden rounded-xl border border-m3-border bg-m3-card shadow-lg"
        style={{ height: 0, opacity: 0, visibility: "hidden", padding: `${MENU_PADDING}px` }}
      >
        <span
          ref={highlightRef}
          aria-hidden
          className="pointer-events-none absolute left-[5px] right-[5px] top-0 rounded-lg bg-m3-hover"
          style={{ opacity: 0 }}
        />
        {options.map((option, index) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              id={`${listboxId}-option-${index}`}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              onPointerEnter={() => open && hoverIndex(index)}
              onPointerMove={() => open && hoverIndex(index)}
              onClick={() => selectOption(option.id)}
              className="relative z-10 flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium text-m3-text cursor-pointer select-none"
              style={{ height: `${ROW_HEIGHT}px`, opacity: 0 }}
            >
              {option.dotColor ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: option.dotColor }}
                  aria-hidden
                />
              ) : null}
              {option.icon ? (
                <span className="shrink-0 text-m3-secondary" aria-hidden>
                  {option.icon}
                </span>
              ) : null}
              <span className="flex-1 truncate">{option.label}</span>
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
                  ref={(element) => {
                    checkRefs.current[index] = element;
                  }}
                  d="M5 12.5l4.5 4.5L19 7.5"
                  style={{ strokeDasharray: 22, strokeDashoffset: isSelected ? 0 : 22 }}
                />
              </svg>
            </button>
          );
        })}
      </div>
    </>
  );
}
