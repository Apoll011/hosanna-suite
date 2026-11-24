// SPDX-License-Identifier: AGPL-3.0-only
import { isTurnstileConfigured } from "@/components/TurnstileWidget";

/** Build captcha fetch options; omit header when Turnstile is not configured. */
export function captchaFetchOptions(token: string | undefined) {
  if (!token) return undefined;
  return { headers: { "x-captcha-response": token } };
}

/** Whether the form must wait for a captcha token before submit. */
export function captchaRequired(): boolean {
  return isTurnstileConfigured();
}
