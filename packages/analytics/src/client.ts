import {
  posthog,
  type EarlyAccessFeature,
  type EarlyAccessFeatureStage,
  type PostHog,
  type PostHogInterface,
} from "posthog-js";
import { formatError } from "./errors.js";
import { buildPostHogOptions } from "./options.js";
import type { AnalyticsClient, AnalyticsConfig } from "./types.js";

export function createAnalyticsClient<TEventMap = Record<string, unknown>>(
  config: AnalyticsConfig,
): AnalyticsClient<TEventMap> {
  let isInitialized = false;
  const isBrowser = typeof window !== "undefined";
  const isEnabled = config.enabled ?? false;

  if (isBrowser && isEnabled && config.apiKey && config.apiHost) {
    try {
      const options = buildPostHogOptions(config);
      posthog.init(config.apiKey, {
        api_host: config.apiHost,
        ...options,
        loaded: (instance: PostHogInterface) => {
          if (config.appName) {
            instance.register({
              app: config.appName,
              ...config.defaultProperties,
            });
          }
          void instance.reloadFeatureFlags();
          config.onLoaded?.(client as AnalyticsClient);
        },
      });
      isInitialized = true;
    } catch (err) {
      if (config.debug) {
        console.error(`[analytics:${config.appName}] Failed to initialize PostHog:`, err);
      }
    }
  } else if (config.debug) {
    console.info(
      `[analytics:${config.appName}] Telemetry is inactive (enabled: ${isEnabled}, isBrowser: ${isBrowser}).`,
    );
  }

  const client: AnalyticsClient<TEventMap> = {
    appName: config.appName,

    isReady(): boolean {
      return isInitialized;
    },

    isEnabled(): boolean {
      return isEnabled;
    },

    track<K extends keyof TEventMap>(name: K, properties?: TEventMap[K]): void {
      if (!isInitialized) return;
      try {
        posthog.capture(String(name), properties as Record<string, unknown>);
      } catch (err) {
        if (config.debug) {
          console.warn(`[analytics:${config.appName}] track error:`, err);
        }
      }
    },

    trackCustom(name: string, properties?: Record<string, unknown>): void {
      if (!isInitialized) return;
      try {
        posthog.capture(name, properties);
      } catch (err) {
        if (config.debug) {
          console.warn(`[analytics:${config.appName}] trackCustom error:`, err);
        }
      }
    },

    trackPageview(url?: string, properties?: Record<string, unknown>): void {
      if (!isInitialized) return;
      try {
        const payload = {
          ...(url ? { $current_url: url } : {}),
          ...properties,
        };
        posthog.capture("$pageview", payload);
      } catch (err) {
        if (config.debug) {
          console.warn(`[analytics:${config.appName}] trackPageview error:`, err);
        }
      }
    },

    captureException(error: unknown, properties?: Record<string, unknown>): void {
      if (!isInitialized) return;
      try {
        const formatted = formatError(error, properties);
        posthog.captureException(formatted.errorInstance, formatted.properties);
      } catch (err) {
        if (config.debug) {
          console.warn(`[analytics:${config.appName}] captureException error:`, err);
        }
      }
    },

    identify(distinctId: string, userProperties?: Record<string, unknown>): void {
      if (!isInitialized) return;
      try {
        posthog.identify(distinctId, userProperties);
      } catch (err) {
        if (config.debug) {
          console.warn(`[analytics:${config.appName}] identify error:`, err);
        }
      }
    },

    reset(): void {
      if (!isInitialized) return;
      try {
        posthog.reset();
      } catch (err) {
        if (config.debug) {
          console.warn(`[analytics:${config.appName}] reset error:`, err);
        }
      }
    },

    registerProperties(properties: Record<string, unknown>): void {
      if (!isInitialized) return;
      try {
        posthog.register(properties);
      } catch (err) {
        if (config.debug) {
          console.warn(`[analytics:${config.appName}] register error:`, err);
        }
      }
    },

    isFeatureEnabled(key: string): boolean {
      if (!isInitialized) return false;
      try {
        return Boolean(posthog.isFeatureEnabled(key));
      } catch {
        return false;
      }
    },

    getFeatureFlag(key: string): boolean | string | undefined {
      if (!isInitialized) return undefined;
      try {
        return posthog.getFeatureFlag(key);
      } catch {
        return undefined;
      }
    },

    getFeatureFlagPayload(key: string): unknown {
      if (!isInitialized) return undefined;
      try {
        return posthog.getFeatureFlagPayload(key);
      } catch {
        return undefined;
      }
    },

    reloadFeatureFlags(): Promise<void> | void {
      if (!isInitialized) return;
      try {
        return posthog.reloadFeatureFlags();
      } catch {
        /* ignore */
      }
    },

    onFeatureFlags(
      callback: (flags: string[], variants: Record<string, string | boolean>) => void,
    ): () => void {
      if (!isInitialized) return () => {};
      try {
        return posthog.onFeatureFlags(callback);
      } catch {
        return () => {};
      }
    },

    getEarlyAccessFeatures(
      callback: (features: EarlyAccessFeature[]) => void,
      forceReload?: boolean,
      stages?: EarlyAccessFeatureStage[],
    ): void {
      if (!isInitialized) {
        callback([]);
        return;
      }
      try {
        posthog.getEarlyAccessFeatures(callback, forceReload, stages);
      } catch {
        callback([]);
      }
    },

    updateEarlyAccessFeatureEnrollment(flagKey: string, isEnrolled: boolean): void {
      if (!isInitialized) return;
      try {
        posthog.updateEarlyAccessFeatureEnrollment(flagKey, isEnrolled);
      } catch {
        /* ignore */
      }
    },

    getPostHog(): PostHog | undefined {
      return isInitialized ? posthog : undefined;
    },
  };

  return client;
}

let globalClient: AnalyticsClient<any> | null = null;

export function getGlobalAnalyticsClient<TEventMap = Record<string, unknown>>(): AnalyticsClient<TEventMap> | null {
  return globalClient as AnalyticsClient<TEventMap> | null;
}

export function setGlobalAnalyticsClient(client: AnalyticsClient<any> | null): void {
  globalClient = client;
}
