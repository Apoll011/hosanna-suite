import type { PostHog } from "posthog-js";
import { getStoredConsent } from "./consent";

let posthogInstance: PostHog | null = null;
let isInitializing = false;

export async function initAnalytics(): Promise<PostHog | null> {
  if (typeof window === "undefined") return null;

  const consent = getStoredConsent();
  if (consent?.choice !== "all") {
    return null;
  }

  const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
  const host =
    (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ||
    "https://eu.i.posthog.com";

  if (!key) {
    return null;
  }

  if (posthogInstance) {
    try {
      posthogInstance.opt_in_capturing();
    } catch {}
    return posthogInstance;
  }

  if (isInitializing) return null;
  isInitializing = true;

  try {
    const posthogModule = await import("posthog-js");
    const ph = posthogModule.default;
    ph.init(key, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,
      persistence: "localStorage+cookie",
      respect_dnt: true,
    });
    posthogInstance = ph;
    return ph;
  } catch {
    return null;
  } finally {
    isInitializing = false;
  }
}

export function optOutAnalytics(): void {
  if (!posthogInstance) return;
  try {
    posthogInstance.opt_out_capturing();
    posthogInstance.reset();
  } catch {}
}

export function syncAnalyticsWithConsent(): void {
  if (typeof window === "undefined") return;
  const consent = getStoredConsent();
  if (consent?.choice === "all") {
    void initAnalytics();
  } else {
    optOutAnalytics();
  }
}
