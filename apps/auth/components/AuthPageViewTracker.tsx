"use client";

import { trackPageview } from "@/lib/analytics";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    trackPageview(url);
  }, [pathname, searchParams]);

  return null;
}

export function AuthPageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}
