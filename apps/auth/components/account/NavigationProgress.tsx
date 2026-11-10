"use client";

import { LoadingBar } from "@hosanna/ui";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Top loading bar for App Router navigations.
 * Starts on internal link click; finishes when pathname/search settle.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const [active, setActive] = useState(false);
  const routeKey = `${pathname}?${search}`;
  const pendingRef = useRef(false);
  const safetyTimer = useRef<number | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        const nextKey = `${url.pathname}?${url.searchParams.toString()}`;
        const currentKey = `${window.location.pathname}?${window.location.search.replace(/^\?/, "")}`;
        if (nextKey === currentKey) return;
        if (!url.pathname.startsWith("/account")) return;
      } catch {
        return;
      }
      pendingRef.current = true;
      setActive(true);
      if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
      safetyTimer.current = window.setTimeout(() => {
        pendingRef.current = false;
        setActive(false);
      }, 8000);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    // Brief delay so the bar is visible on fast transitions.
    const t = window.setTimeout(() => setActive(false), 120);
    return () => window.clearTimeout(t);
  }, [routeKey]);

  return <LoadingBar active={active} />;
}
