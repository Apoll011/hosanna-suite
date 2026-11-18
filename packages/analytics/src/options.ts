import type { AnalyticsConfig } from "./types";

export const POSTHOG_INIT_OPTIONS = {
  defaults: "2026-08-29",
  capture_pageview: false,
  capture_pageleave: true,
  autocapture: true,
  capture_dead_clicks: true,
  capture_performance: true,
  disable_session_recording: true,
  capture_exceptions: {
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
    capture_console_errors: true,
  },
} as const;

export function buildPostHogOptions(config: AnalyticsConfig): Record<string, unknown> {
  return {
    ...POSTHOG_INIT_OPTIONS,
    capture_pageview: config.capturePageviews ?? POSTHOG_INIT_OPTIONS.capture_pageview,
    capture_pageleave: config.capturePageleave ?? POSTHOG_INIT_OPTIONS.capture_pageleave,
    autocapture: config.autocapture ?? POSTHOG_INIT_OPTIONS.autocapture,
    capture_dead_clicks: config.captureDeadClicks ?? POSTHOG_INIT_OPTIONS.capture_dead_clicks,
    capture_performance: config.capturePerformance ?? POSTHOG_INIT_OPTIONS.capture_performance,
    disable_session_recording:
      config.disableSessionRecording ?? POSTHOG_INIT_OPTIONS.disable_session_recording,
    capture_exceptions: {
      capture_unhandled_errors:
        config.captureUnhandledErrors ??
        POSTHOG_INIT_OPTIONS.capture_exceptions.capture_unhandled_errors,
      capture_unhandled_rejections:
        config.captureUnhandledRejections ??
        POSTHOG_INIT_OPTIONS.capture_exceptions.capture_unhandled_rejections,
      capture_console_errors:
        config.captureConsoleErrors ??
        POSTHOG_INIT_OPTIONS.capture_exceptions.capture_console_errors,
    },
  };
}
