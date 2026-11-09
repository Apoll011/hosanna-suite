"use client";

import { useTheme } from "@/lib/theme";
import { useEffect, useRef } from "react";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

declare global {
  interface Window {
    TurnstileCallback?: {
      postMessage: (message: string) => void;
    };
  }
}

export function CaptchaPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const post = (message: string) => {
      window.TurnstileCallback?.postMessage(message);
    };

    if (!TURNSTILE_SITE_KEY) {
      post("error");
      return;
    }

    const render = () => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: darkMode ? "dark" : "light",
        callback: (token: string) => post(token),
        "expired-callback": () => post("expired"),
        "error-callback": () => post("error"),
      });
    };

    if (window.turnstile) {
      render();
      return;
    }

    window.onTurnstileLoad = render;
    if (!document.querySelector("#cf-turnstile-script")) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [darkMode]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center">
        <div ref={containerRef} className="flex justify-center" />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Security verification</p>
      </div>
    </div>
  );
}
