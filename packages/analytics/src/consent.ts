// SPDX-License-Identifier: AGPL-3.0-only
import { useSyncExternalStore, useState, useEffect } from "react";

export type ConsentValue = "all" | "essential";

export interface CookieConsentRecord {
  choice: ConsentValue;
  timestamp: number;
}

export const CONSENT_COOKIE_NAME = "hosanna_cookie_consent";
export const CONSENT_STORAGE_KEY = "hosanna_cookie_consent";
const CONSENT_CHANGE_EVENT = "hosanna:cookie-consent-change";
const REOPEN_BANNER_EVENT = "hosanna:cookie-banner-reopen";

function consentCookieDomain(): string {
  if (typeof location === "undefined") return "";
  const host = location.hostname;
  if (host === "hosanna.live" || host.endsWith(".hosanna.live")) {
    return "; Domain=.hosanna.live";
  }
  return "";
}

function writeConsentCookie(choice: ConsentValue): void {
  try {
    document.cookie = `${CONSENT_COOKIE_NAME}=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${consentCookieDomain()}`;
  } catch {
    /* cookie blocked */
  }
}

function readConsentCookie(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  try {
    const escaped = CONSENT_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    if (!match) return null;
    const value = decodeURIComponent(match[1] ?? "");
    if (value === "all" || value === "essential") return value;
  } catch {
    /* ignore */
  }
  return null;
}

export function getStoredConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;

  const cookieChoice = readConsentCookie();
  if (cookieChoice) {
    return { choice: cookieChoice, timestamp: 0 };
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (
      parsed &&
      (parsed.choice === "all" || parsed.choice === "essential") &&
      typeof parsed.timestamp === "number"
    ) {
      return { choice: parsed.choice, timestamp: parsed.timestamp };
    }
  } catch {
    /* localStorage unavailable or invalid JSON */
  }
  return null;
}

export function setStoredConsent(choice: ConsentValue): CookieConsentRecord {
  const record: CookieConsentRecord = { choice, timestamp: Date.now() };
  if (typeof window !== "undefined") {
    writeConsentCookie(choice);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* quota / private mode */
    }
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: record }));
  }
  return record;
}

export function reopenCookieBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REOPEN_BANNER_EVENT));
}

let cachedConsent: CookieConsentRecord | null | undefined = undefined;

function subscribeConsent(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    cachedConsent = getStoredConsent();
    callback();
  };
  window.addEventListener(CONSENT_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getConsentSnapshot(): CookieConsentRecord | null {
  if (cachedConsent === undefined) {
    cachedConsent = getStoredConsent();
  }
  return cachedConsent;
}

export function useCookieConsent() {
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, () => null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (consent === null) {
      setIsOpen(true);
    }
  }, [consent]);

  useEffect(() => {
    const handleReopen = () => setIsOpen(true);
    window.addEventListener(REOPEN_BANNER_EVENT, handleReopen);
    return () => window.removeEventListener(REOPEN_BANNER_EVENT, handleReopen);
  }, []);

  const acceptAll = () => {
    setStoredConsent("all");
    setIsOpen(false);
  };

  const acceptEssentialOnly = () => {
    setStoredConsent("essential");
    setIsOpen(false);
  };

  const close = () => {
    setIsOpen(false);
  };

  return {
    consent,
    hasChosen: consent !== null,
    isOpen,
    acceptAll,
    acceptEssentialOnly,
    reopen: reopenCookieBanner,
    close,
  };
}
