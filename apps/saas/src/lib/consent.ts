import { useEffect, useState, useSyncExternalStore } from "react";

export type ConsentValue = "all" | "essential";

export interface CookieConsentRecord {
  choice: ConsentValue;
  timestamp: number;
}

export const CONSENT_STORAGE_KEY = "hosanna_cookie_consent";
const CONSENT_CHANGE_EVENT = "hosanna:cookie-consent-change";
const REOPEN_BANNER_EVENT = "hosanna:cookie-banner-reopen";

export function getStoredConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentRecord>;
    if (parsed && (parsed.choice === "all" || parsed.choice === "essential") && typeof parsed.timestamp === "number") {
      return { choice: parsed.choice, timestamp: parsed.timestamp };
    }
  } catch {
    // LocalStorage unavailable or invalid JSON
  }
  return null;
}

export function setStoredConsent(choice: ConsentValue): CookieConsentRecord {
  const record: CookieConsentRecord = {
    choice,
    timestamp: Date.now(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // LocalStorage write failed (e.g. quota, private mode)
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
    // Open on first visit if no consent record is stored yet
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
