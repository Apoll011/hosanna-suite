/**
 * Persist org AI settings so the account AI page paints instantly on revisit
 * while a background refresh runs.
 */

import type { AiBillingResponse, AiSettingsPublic } from "@/lib/ai-api";

const SETTINGS_PREFIX = "hosanna.auth.cached_ai_settings.";
const BILLING_PREFIX = "hosanna.auth.cached_ai_billing.";

const settingsMemory = new Map<string, AiSettingsPublic>();
const billingMemory = new Map<string, AiBillingResponse>();

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function removeKey(key: string): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function isSettingsShape(value: unknown): value is AiSettingsPublic {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.provider === "string" &&
    typeof v.model === "string" &&
    typeof v.enabled === "boolean" &&
    typeof v.configured === "boolean" &&
    typeof v.modelPresets === "object" &&
    v.modelPresets !== null
  );
}

export function readCachedAiSettings(orgId: string): AiSettingsPublic | null {
  const mem = settingsMemory.get(orgId);
  if (mem) return mem;
  const parsed = readJson<unknown>(SETTINGS_PREFIX + orgId);
  if (!isSettingsShape(parsed)) return null;
  settingsMemory.set(orgId, parsed);
  return parsed;
}

export function writeCachedAiSettings(orgId: string, data: AiSettingsPublic): void {
  settingsMemory.set(orgId, data);
  writeJson(SETTINGS_PREFIX + orgId, data);
}

export function clearCachedAiSettings(orgId: string): void {
  settingsMemory.delete(orgId);
  removeKey(SETTINGS_PREFIX + orgId);
}

export function readCachedAiBilling(orgId: string): AiBillingResponse | null {
  const mem = billingMemory.get(orgId);
  if (mem) return mem;
  const parsed = readJson<AiBillingResponse>(BILLING_PREFIX + orgId);
  if (!parsed || typeof parsed !== "object" || !("supported" in parsed)) return null;
  billingMemory.set(orgId, parsed);
  return parsed;
}

export function writeCachedAiBilling(orgId: string, data: AiBillingResponse): void {
  billingMemory.set(orgId, data);
  writeJson(BILLING_PREFIX + orgId, data);
}
