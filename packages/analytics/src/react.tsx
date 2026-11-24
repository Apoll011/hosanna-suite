// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import {
  Component,
  createContext,
  useContext,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { getGlobalAnalyticsClient } from "./client.js";
import type { AnalyticsClient, EarlyAccessFeature, EarlyAccessFeatureStage } from "./types.js";

const AnalyticsContext = createContext<AnalyticsClient<any> | null>(null);

export interface AnalyticsProviderProps {
  client: AnalyticsClient<any>;
  children: ReactNode;
}

export function AnalyticsProvider({ client, children }: AnalyticsProviderProps) {
  return <AnalyticsContext.Provider value={client}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics<TEventMap = Record<string, unknown>>(): AnalyticsClient<TEventMap> {
  const context = useContext(AnalyticsContext);
  const client = (context ?? getGlobalAnalyticsClient()) as AnalyticsClient<TEventMap> | null;

  if (!client) {
    return {
      appName: "noop",
      isReady: () => false,
      isEnabled: () => false,
      track: () => {},
      trackCustom: () => {},
      trackPageview: () => {},
      captureException: () => {},
      identify: () => {},
      reset: () => {},
      registerProperties: () => {},
      isFeatureEnabled: () => false,
      getFeatureFlag: () => undefined,
      getFeatureFlagPayload: () => undefined,
      reloadFeatureFlags: () => {},
      onFeatureFlags: () => () => {},
      getEarlyAccessFeatures: (cb: (features: EarlyAccessFeature[]) => void) => cb([]),
      updateEarlyAccessFeatureEnrollment: () => {},
      getPostHog: () => undefined,
    };
  }

  return client;
}

export function useFeatureFlag(flagKey: string): boolean | string | undefined {
  const client = useAnalytics();
  const [flagValue, setFlagValue] = useState<boolean | string | undefined>(() =>
    client.getFeatureFlag(flagKey),
  );

  useEffect(() => {
    setFlagValue(client.getFeatureFlag(flagKey));

    const unsubscribe = client.onFeatureFlags(() => {
      setFlagValue(client.getFeatureFlag(flagKey));
    });

    return () => {
      unsubscribe();
    };
  }, [client, flagKey]);

  return flagValue;
}

export function useEarlyAccessFeatures(
  stages: EarlyAccessFeatureStage[] = ["concept", "alpha", "beta"],
) {
  const client = useAnalytics();
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.getEarlyAccessFeatures(
      (loadedFeatures: EarlyAccessFeature[]) => {
        setFeatures(loadedFeatures);
        setLoading(false);
      },
      true,
      stages,
    );
  }, [client, stages]);

  const updateEnrollment = (flagKey: string, isEnrolled: boolean) => {
    client.updateEarlyAccessFeatureEnrollment(flagKey, isEnrolled);
    client.reloadFeatureFlags();
  };

  return { features, loading, updateEnrollment };
}

export interface PageViewTrackerProps {
  currentUrl?: string;
  properties?: Record<string, unknown>;
}

export function PageViewTracker({ currentUrl, properties }: PageViewTrackerProps) {
  const client = useAnalytics();

  useEffect(() => {
    const url = currentUrl ?? (typeof window !== "undefined" ? window.location.href : undefined);
    client.trackPageview(url, properties);
  }, [client, currentUrl, properties]);

  return null;
}

export interface AnalyticsErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  client?: AnalyticsClient<any>;
}

interface AnalyticsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AnalyticsErrorBoundary extends Component<
  AnalyticsErrorBoundaryProps,
  AnalyticsErrorBoundaryState
> {
  constructor(props: AnalyticsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AnalyticsErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const activeClient = this.props.client ?? getGlobalAnalyticsClient();
    activeClient?.captureException(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error, this.reset);
      }
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}
