import type {
  EarlyAccessFeature,
  EarlyAccessFeatureStage,
  PostHog,
  PostHogInterface,
} from "posthog-js";

export type { EarlyAccessFeature, EarlyAccessFeatureStage, PostHog, PostHogInterface };

export interface AnalyticsConfig {
  appName: string;
  apiKey?: string;
  apiHost?: string;
  enabled?: boolean;
  dev?: boolean;
  debug?: boolean;
  capturePageviews?: boolean;
  capturePageleave?: boolean;
  autocapture?: boolean;
  captureDeadClicks?: boolean;
  capturePerformance?: boolean;
  captureUnhandledErrors?: boolean;
  captureUnhandledRejections?: boolean;
  captureConsoleErrors?: boolean;
  disableSessionRecording?: boolean;
  defaultProperties?: Record<string, unknown>;
  onLoaded?: (client: AnalyticsClient) => void;
}

export interface AnalyticsClient<TEventMap = Record<string, unknown>> {
  readonly appName: string;
  isReady(): boolean;
  isEnabled(): boolean;
  track<K extends keyof TEventMap>(name: K, properties?: TEventMap[K]): void;
  trackCustom(name: string, properties?: Record<string, unknown>): void;
  trackPageview(url?: string, properties?: Record<string, unknown>): void;
  captureException(error: unknown, properties?: Record<string, unknown>): void;
  identify(distinctId: string, userProperties?: Record<string, unknown>): void;
  reset(): void;
  registerProperties(properties: Record<string, unknown>): void;
  isFeatureEnabled(key: string): boolean;
  getFeatureFlag(key: string): boolean | string | undefined;
  getFeatureFlagPayload(key: string): unknown;
  reloadFeatureFlags(): Promise<void> | void;
  onFeatureFlags(
    callback: (flags: string[], variants: Record<string, string | boolean>) => void,
  ): () => void;
  getEarlyAccessFeatures(
    callback: (features: EarlyAccessFeature[]) => void,
    forceReload?: boolean,
    stages?: EarlyAccessFeatureStage[],
  ): void;
  updateEarlyAccessFeatureEnrollment(flagKey: string, isEnrolled: boolean): void;
  getPostHog(): PostHog | undefined;
}
