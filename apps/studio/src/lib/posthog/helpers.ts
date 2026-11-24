// SPDX-License-Identifier: AGPL-3.0-only
import {
  POSTHOG_INIT_OPTIONS,
  isAnalyticsEnabled,
  resolvePostHogConfig as resolveConfig,
  type AnalyticsEnv,
} from "@hosanna/analytics";

export type PostHogEnv = AnalyticsEnv;
export { POSTHOG_INIT_OPTIONS };

export function isPostHogEnabled(env: AnalyticsEnv): boolean {
  return isAnalyticsEnabled(env);
}

export function resolvePostHogConfig(env: AnalyticsEnv): { token: string; host: string } | null {
  return resolveConfig(env);
}
