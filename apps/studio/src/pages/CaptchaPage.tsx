/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Public (unauthenticated) page that renders a Cloudflare Turnstile widget and
 * posts the resulting token to the native Hosanna app.
 *
 * The Flutter mobile app loads this page in a WebView with a JavascriptChannel
 * named `TurnstileCallback`. On success we call `TurnstileCallback.postMessage(token)`;
 * on error/expiry we post `error`/`expired` so the app can fall back gracefully.
 */
import React, { useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";

const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

declare global {
  interface Window {
    // `turnstile` and `onTurnstileLoad` are already declared globally by
    // `Login/components/TurnstileWidget.tsx`; we only add the JS channel the
    // Flutter WebView exposes.
    TurnstileCallback?: {
      postMessage: (message: string) => void;
    };
  }
}

export const CaptchaPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    const post = (message: string) => {
      window.TurnstileCallback?.postMessage(message);
    };

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
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
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
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Verificação de segurança
        </p>
      </div>
    </div>
  );
};

export default CaptchaPage;
