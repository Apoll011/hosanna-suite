export interface AnalyticsEnv {
  PROD?: boolean;
  NODE_ENV?: string;
  VITE_PUBLIC_POSTHOG_KEY?: string;
  VITE_PUBLIC_POSTHOG_HOST?: string;
  VITE_PUBLIC_POSTHOG_DEV?: string | boolean;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXT_PUBLIC_POSTHOG_DEV?: string | boolean;
  POSTHOG_KEY?: string;
  POSTHOG_HOST?: string;
  POSTHOG_DEV?: string | boolean;
}

export function isAnalyticsEnabled(env: AnalyticsEnv): boolean {
  const isProd = env.PROD === true || env.NODE_ENV === "production";
  const devOptIn =
    env.VITE_PUBLIC_POSTHOG_DEV === "true" ||
    env.VITE_PUBLIC_POSTHOG_DEV === true ||
    env.NEXT_PUBLIC_POSTHOG_DEV === "true" ||
    env.NEXT_PUBLIC_POSTHOG_DEV === true ||
    env.POSTHOG_DEV === "true" ||
    env.POSTHOG_DEV === true;

  return isProd || devOptIn;
}

export function resolvePostHogConfig(env: AnalyticsEnv): { token: string; host: string } | null {
  if (!isAnalyticsEnabled(env)) return null;

  const token =
    env.VITE_PUBLIC_POSTHOG_KEY || env.NEXT_PUBLIC_POSTHOG_KEY || env.POSTHOG_KEY || undefined;

  const host =
    env.VITE_PUBLIC_POSTHOG_HOST || env.NEXT_PUBLIC_POSTHOG_HOST || env.POSTHOG_HOST || undefined;

  if (!token || !host) return null;

  return { token, host };
}

export function detectRuntimeEnv(): AnalyticsEnv {
  const resolved: AnalyticsEnv = {};

  if (typeof process !== "undefined" && process?.env) {
    resolved.NODE_ENV = process.env.NODE_ENV;
    resolved.NEXT_PUBLIC_POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    resolved.NEXT_PUBLIC_POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    resolved.NEXT_PUBLIC_POSTHOG_DEV = process.env.NEXT_PUBLIC_POSTHOG_DEV;
    resolved.VITE_PUBLIC_POSTHOG_KEY = process.env.VITE_PUBLIC_POSTHOG_KEY;
    resolved.VITE_PUBLIC_POSTHOG_HOST = process.env.VITE_PUBLIC_POSTHOG_HOST;
    resolved.VITE_PUBLIC_POSTHOG_DEV = process.env.VITE_PUBLIC_POSTHOG_DEV;
    resolved.POSTHOG_KEY = process.env.POSTHOG_KEY;
    resolved.POSTHOG_HOST = process.env.POSTHOG_HOST;
    resolved.POSTHOG_DEV = process.env.POSTHOG_DEV;
  }

  const metaEnv = (import.meta as { env?: Record<string, string | boolean | undefined> }).env;
  if (metaEnv) {
    if (metaEnv.PROD !== undefined) resolved.PROD = metaEnv.PROD === true;
    if (metaEnv.VITE_PUBLIC_POSTHOG_KEY) {
      resolved.VITE_PUBLIC_POSTHOG_KEY = String(metaEnv.VITE_PUBLIC_POSTHOG_KEY);
    }
    if (metaEnv.VITE_PUBLIC_POSTHOG_HOST) {
      resolved.VITE_PUBLIC_POSTHOG_HOST = String(metaEnv.VITE_PUBLIC_POSTHOG_HOST);
    }
    if (metaEnv.VITE_PUBLIC_POSTHOG_DEV !== undefined) {
      resolved.VITE_PUBLIC_POSTHOG_DEV = metaEnv.VITE_PUBLIC_POSTHOG_DEV;
    }
  }

  return resolved;
}
