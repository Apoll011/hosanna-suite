/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import React from "react";
import { useSync, type ToastProgress } from "../contexts/SyncContext";

function CircularProgress({ progress }: { progress: ToastProgress }) {
  const size = 28;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio =
    progress.indeterminate || !progress.total || progress.total <= 0
      ? null
      : Math.max(0, Math.min(1, progress.value / progress.total));

  return (
    <div
      className={`relative shrink-0 ${progress.indeterminate || ratio === null ? "animate-spin" : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-m3-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={ratio === null ? circumference * 0.75 : circumference * (1 - ratio)}
          className="text-m3-primary transition-[stroke-dashoffset] duration-200"
        />
      </svg>
    </div>
  );
}

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useSync();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-m3-danger shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-m3-primary shrink-0" />,
  };

  return (
    <div className="fixed bottom-8 right-8 z-100 flex flex-col gap-4 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start justify-between gap-4 p-5 bg-m3-card/80 backdrop-blur-xl border border-m3-border/50 rounded-xl shadow-lg shadow-black/20 animate-in slide-in-from-right-10 duration-300"
        >
          <div className="flex items-start gap-4 flex-1">
            <div className="mt-0.5">
              {toast.progress ? <CircularProgress progress={toast.progress} /> : icons[toast.type]}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title ? (
                <>
                  <p className="text-[13px] font-bold text-m3-text">{toast.title}</p>
                  {toast.description && (
                    <p className="text-[12px] text-m3-secondary mt-1">{toast.description}</p>
                  )}
                </>
              ) : (
                <p className="text-[13px] font-bold text-m3-text">{toast.text}</p>
              )}
              {toast.action && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-m3-primary text-white hover:bg-m3-primary/90 transition-colors cursor-pointer shadow-sm"
                  >
                    {toast.action.label}
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1.5 text-m3-secondary hover:text-m3-text hover:bg-m3-hover rounded-xl transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
