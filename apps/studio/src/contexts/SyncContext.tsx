/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ensureOrgScopedData, getDatabase, resetReplication, setupReplication } from "../db";
import type { ReplicationManager } from "../db";
import { SyncStatus } from "../types";
import { useAuth } from "./AuthContext";
import { isDemoMode } from "../demo/index";

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface ToastProgress {
  value: number;
  total?: number;
  indeterminate?: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  text?: string;
  title?: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  progress?: ToastProgress;
  onDismiss?: () => void;
}

interface ShowToastOptions {
  type?: ToastMessage["type"];
  title?: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  progress?: ToastProgress;
  onDismiss?: () => void;
}

type ToastUpdate = Partial<Omit<ToastMessage, "id">>;

interface SyncContextType {
  syncStatus: SyncStatus;
  toasts: ToastMessage[];
  showToast: (textOrOptions: string | ShowToastOptions, type?: ToastMessage["type"]) => string;
  updateToast: (id: string, patch: ToastUpdate) => void;
  removeToast: (id: string) => void;
  triggerSyncCheck: () => Promise<void>;
  lastSyncedAt: Date | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const replicationManagerRef = useRef<ReplicationManager | null>(null);

  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => {
      const leaving = prev.find((t) => t.id === id);
      if (leaving?.onDismiss) {
        try {
          leaving.onDismiss();
        } catch {
          /* ignore */
        }
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const scheduleAutoDismiss = useCallback((id: string, duration: number) => {
    const existing = toastTimersRef.current.get(id);
    if (existing !== undefined) {
      clearTimeout(existing);
      toastTimersRef.current.delete(id);
    }
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      toastTimersRef.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    toastTimersRef.current.set(id, timer);
  }, []);

  const showToast = useCallback(
    (textOrOptions: string | ShowToastOptions, type: ToastMessage["type"] = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      let toastItem: ToastMessage;

      if (typeof textOrOptions === "string") {
        toastItem = { id, type, text: textOrOptions };
      } else {
        toastItem = {
          id,
          type: textOrOptions.type || "info",
          title: textOrOptions.title,
          description: textOrOptions.description,
          action: textOrOptions.action,
          duration: textOrOptions.duration,
          progress: textOrOptions.progress,
          onDismiss: textOrOptions.onDismiss,
        };
      }

      setToasts((prev) => [...prev, toastItem]);
      scheduleAutoDismiss(id, toastItem.duration !== undefined ? toastItem.duration : 4000);
      return id;
    },
    [scheduleAutoDismiss],
  );

  const updateToast = useCallback(
    (id: string, patch: ToastUpdate) => {
      setToasts((prev) =>
        prev.map((toast) => {
          if (toast.id !== id) return toast;
          const next = { ...toast, ...patch };
          if (patch.duration !== undefined) {
            scheduleAutoDismiss(id, patch.duration);
          }
          return next;
        }),
      );
    },
    [scheduleAutoDismiss],
  );

  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const { isAuthenticated, organization } = useAuth();
  const orgSlug = organization?.slug ?? null;

  // Sync setup invariants:
  // 1. resetReplication() runs sync before await getDatabase() so the previous manager dies immediately.
  // 2. isMounted guards StrictMode double-invoke.
  // 3. cleanup unsubscribes the sub from this effect invocation only.
  // 4. org-slug stamp must match before sync starts.
  useEffect(() => {
    resetReplication();
    replicationManagerRef.current = null;

    let sub: { unsubscribe: () => void } | null = null;
    let isMounted = true;

    async function initDbAndSync() {
      try {
        const db = await getDatabase();
        if (!isMounted) return;

        if (isDemoMode()) {
          setSyncStatus("local_only" as SyncStatus);
          return;
        }

        const scope = await ensureOrgScopedData(db, orgSlug);
        if (!isMounted) return;

        if (!isAuthenticated || !scope.matched || !orgSlug) {
          return;
        }

        const repl = setupReplication(db, orgSlug);
        replicationManagerRef.current = repl;

        sub = repl.status$.subscribe((st) => {
          setSyncStatus(st as unknown as SyncStatus);
          if (st === "synced") {
            setLastSyncedAt(new Date());
          }
        });

        repl.start({ forceFullPull: scope.cleared });
      } catch (err) {
        console.error("[SyncContext] Failed to initialize DB / Replication:", err);
        if (isMounted) setSyncStatus("error" as SyncStatus);
      }
    }

    void initDbAndSync();

    return () => {
      isMounted = false;
      if (sub) sub.unsubscribe();
      replicationManagerRef.current?.stop();
    };
  }, [isAuthenticated, orgSlug]);

  const triggerSyncCheck = useCallback(async () => {
    if (isDemoMode()) return;
    if (replicationManagerRef.current) {
      await replicationManagerRef.current.replicateNow();
    }
  }, []);

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        toasts,
        showToast,
        updateToast,
        removeToast,
        triggerSyncCheck,
        lastSyncedAt,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};
