"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Toast = { msg: string; type: "success" | "error" } | null;

type ToastApi = {
  toast: Toast;
  showToast: (msg: string, type?: "success" | "error") => void;
  clearToast: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function AccountToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const value = useMemo(
    () => ({ toast, showToast, clearToast }),
    [toast, showToast, clearToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useAccountToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Pages may still manage local toast; provide a no-op when outside provider.
    return {
      toast: null,
      showToast: () => undefined,
      clearToast: () => undefined,
    };
  }
  return ctx;
}

export function AccountToastBanner({ toast }: { toast?: Toast }) {
  if (!toast) return null;
  return (
    <div className="w-full px-4 pt-4 sm:px-6 lg:px-8" role="status">
      <div
        className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium animate-in fade-in duration-200 ${
          toast.type === "error"
            ? "border-m3-danger/30 bg-m3-danger/10 text-m3-danger"
            : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        }`}
      >
        {toast.msg}
      </div>
    </div>
  );
}
