"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

export interface ContextMenuSurfaceProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  x: number;
  y: number;
  open?: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
}

export function ContextMenuSurface({
  x,
  y,
  open = true,
  onClose,
  ariaLabel,
  className,
  children,
  ...props
}: ContextMenuSurfaceProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useEffect(() => {
    if (!open) return;
    setPosition({
      top: Math.max(8, Math.min(y, window.innerHeight - 320)),
      left: Math.max(8, Math.min(x, window.innerWidth - 240)),
    });
    const menu = menuRef.current;
    const firstItem = menu?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"]), button:not(:disabled)',
    );
    firstItem?.focus({ preventScroll: true });

    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menu?.contains(event.target)) onClose();
    };
    window.addEventListener("pointerdown", dismissOutside);
    return () => window.removeEventListener("pointerdown", dismissOutside);
  }, [onClose, open, x, y]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    props.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const menu = menuRef.current;
    if (!menu) return;
    const items = Array.from(
      menu.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"]), button:not(:disabled)',
      ),
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[nextIndex]?.focus();
    }
  };

  return (
    <div
      {...props}
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      style={{
        ...props.style,
        ...position,
      }}
      className={cn(
        "fixed z-80 flex max-h-[min(24rem,calc(100dvh-1rem))] w-60 flex-col gap-0.5 overflow-y-auto rounded-xl border border-m3-border bg-m3-card p-1.5 text-xs shadow-lg hosanna-surface-enter",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ContextMenuItem({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      role="menuitem"
      className={cn(
        "flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-m3-text transition-[background-color,color,transform] duration-150 hover:bg-m3-hover focus-visible:bg-m3-hover focus-visible:outline-none active:scale-[0.985]",
        className,
      )}
    />
  );
}

export function ContextMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} role="separator" className={cn("my-1 border-t border-m3-border", className)} />;
}

export function ContextMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "mb-0.5 flex items-center justify-between truncate border-b border-m3-border px-3 py-1.5 text-label",
        className,
      )}
    />
  );
}
