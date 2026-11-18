export interface PostHogEnv {
  PROD: boolean;
  VITE_PUBLIC_POSTHOG_KEY?: string;
  VITE_PUBLIC_POSTHOG_HOST?: string;
  VITE_PUBLIC_POSTHOG_DEV?: string;
}

export const POSTHOG_INIT_OPTIONS = {
  defaults: "2026-08-29",
  capture_pageview: false,
  capture_pageleave: true,
  autocapture: true,
  capture_dead_clicks: true,
  capture_performance: true,
  capture_exceptions: {
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
    capture_console_errors: true,
  },
  session_recording: {
    maskAllInputs: true,
  },
} as const;

export function isPostHogEnabled(env: PostHogEnv): boolean {
  return env.PROD || env.VITE_PUBLIC_POSTHOG_DEV === "true";
}

export function resolvePostHogConfig(env: PostHogEnv): { token: string; host: string } | null {
  if (!isPostHogEnabled(env)) return null;
  const token = env.VITE_PUBLIC_POSTHOG_KEY;
  const host = env.VITE_PUBLIC_POSTHOG_HOST;
  if (!token || !host) return null;
  return { token, host };
}
