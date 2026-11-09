"use client";

import { useTheme } from "@/lib/theme";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export interface TurnstileHandle {
  reset: () => void;
  show: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

/** True when a real site key is configured (skip captcha in local/dev otherwise). */
export function isTurnstileConfigured(): boolean {
  return Boolean(TURNSTILE_SITE_KEY);
}

export const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  ({ onVerify, onExpire, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const { darkMode } = useTheme();
    const [requiresInteraction, setRequiresInteraction] = useState(false);

    const onVerifyRef = useRef(onVerify);
    onVerifyRef.current = onVerify;
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const renderWidget = useCallback(() => {
      if (!TURNSTILE_SITE_KEY || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: darkMode ? "dark" : "light",
        size: "flexible",
        callback: (token: string) => {
          setRequiresInteraction(false);
          onVerifyRef.current(token);
        },
        "before-interactive-callback": () => {
          setRequiresInteraction(true);
        },
        "after-interactive-callback": () => {
          setRequiresInteraction(false);
        },
        "expired-callback": () => {
          onExpireRef.current?.();
        },
        "error-callback": () => {
          onErrorRef.current?.();
        },
      });
    }, [darkMode]);

    useEffect(() => {
      if (!TURNSTILE_SITE_KEY) return;

      if (window.turnstile) {
        renderWidget();
        return;
      }

      window.onTurnstileLoad = renderWidget;
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
    }, [renderWidget]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        setRequiresInteraction(false);
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
      show: () => setRequiresInteraction(true),
    }));

    if (!TURNSTILE_SITE_KEY) return null;

    return (
      <div
        className={`transition-all duration-300 flex justify-center w-full overflow-hidden ${
          requiresInteraction
            ? "my-3 max-h-24 opacity-100"
            : "max-h-0 opacity-0 pointer-events-none my-0"
        }`}
        aria-hidden={!requiresInteraction}
      >
        <div ref={containerRef} className="w-full flex justify-center" />
      </div>
    );
  },
);

TurnstileWidget.displayName = "TurnstileWidget";
