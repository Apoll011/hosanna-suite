/**
 * Owns auto-start, missed-tour toast, and relaunch registration for the
 * permission-composed product tour.
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { useSync } from "@/src/contexts/SyncContext";
import { isDemoMode } from "@/src/demo";
import {
  shouldAutoStartProductTour,
  shouldOfferMissedProductTour,
  usePersonalSettings,
} from "@/src/hooks/usePersonalSettings";
import { deriveView } from "@/src/layouts/view";
import { useI18n } from "@/src/lib/i18n";
import { useActiveRole } from "@/src/lib/permissions/client";
import {
  destroyProductTour,
  isProductTourRunning,
  registerInteractiveOnboardingStarter,
  registerProductTourStarter,
  runProductTour,
} from "@/src/lib/tour";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

export const ProductTourController: React.FC = () => {
  const { t } = useI18n();
  const location = useLocation();
  const { organization } = useAuth();
  const { role, loading: roleLoading } = useActiveRole();
  const { settings, updateSetting } = usePersonalSettings();
  const { showToast } = useSync();

  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const view = useMemo(
    () => deriveView(location.pathname, slugPrefix),
    [location.pathname, slugPrefix],
  );

  const autoStartedRef = useRef(false);
  const missedOfferedRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  /** Prevents missed-toast onDismiss from firing after user clicks Start. */
  const missedAcceptedRef = useRef(false);

  const isGuest = role === "guest";
  const isFoldersView = view === "explorer";
  const demo = isDemoMode();

  const markCompleted = useCallback(() => {
    updateSetting("productTourCompleted", true);
    updateSetting("productTourDismissedAt", null);
  }, [updateSetting]);

  const markDismissed = useCallback(() => {
    updateSetting("productTourCompleted", false);
    updateSetting("productTourDismissedAt", new Date().toISOString());
  }, [updateSetting]);

  const launchInteractiveOnboarding = useCallback(() => {
    // Phase B will isolate IDB; until then open demo with an onboarding hint.
    const url = new URL("/demo", window.location.origin);
    url.searchParams.set("onboarding", "1");
    url.searchParams.set("role", role ?? "musician");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }, [role]);

  const launchTour = useCallback(
    (opts?: { force?: boolean }) => {
      if (demo || isGuest || roleLoading || !role) return;
      if (isProductTourRunning()) return;

      if (settingsRef.current.sidebarCollapsed) {
        updateSetting("sidebarCollapsed", false);
      }

      requestAnimationFrame(() => {
        const started = runProductTour({
          role,
          flags: { collectionsEnabled: true, agendaEnabled: true },
          t,
          labels: {
            next: t("tour.product.controls.next"),
            previous: t("tour.product.controls.previous"),
            done: t("tour.product.controls.done"),
            close: t("tour.product.controls.close"),
            progress: t("tour.product.controls.progress"),
            tryInteractive: t("tour.product.controls.tryInteractive"),
          },
          onCompleted: markCompleted,
          onDismissed: markDismissed,
          onStartInteractive: launchInteractiveOnboarding,
        });

        if (!started && opts?.force) {
          showToast({
            type: "info",
            title: t("tour.product.unavailableTitle"),
            description: t("tour.product.unavailableDesc"),
          });
        }
      });
    },
    [
      demo,
      isGuest,
      roleLoading,
      role,
      updateSetting,
      t,
      markCompleted,
      markDismissed,
      launchInteractiveOnboarding,
      showToast,
    ],
  );

  useEffect(() => {
    registerProductTourStarter(() => launchTour({ force: true }));
    registerInteractiveOnboardingStarter(launchInteractiveOnboarding);
    return () => {
      registerProductTourStarter(null);
      registerInteractiveOnboardingStarter(null);
      destroyProductTour();
    };
  }, [launchTour, launchInteractiveOnboarding]);

  // Auto-start after first landing on /folders (non-guests, pending flag)
  useEffect(() => {
    if (demo || isGuest || roleLoading || !role) return;
    if (!isFoldersView) return;
    if (autoStartedRef.current) return;
    if (!shouldAutoStartProductTour(settings)) return;

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => launchTour(), 600);
    return () => window.clearTimeout(timer);
  }, [demo, isGuest, roleLoading, role, isFoldersView, settings, launchTour]);

  // Legacy users (null flag): sticky “you missed the tour” toast once
  useEffect(() => {
    if (demo || isGuest || roleLoading || !role) return;
    if (!isFoldersView) return;
    if (missedOfferedRef.current) return;
    if (!shouldOfferMissedProductTour(settings)) return;

    missedOfferedRef.current = true;
    missedAcceptedRef.current = false;

    showToast({
      type: "info",
      title: t("tour.product.missedTitle"),
      description: t("tour.product.missedDesc"),
      duration: 0,
      action: {
        label: t("tour.product.missedAction"),
        onClick: () => {
          missedAcceptedRef.current = true;
          updateSetting("productTourCompleted", false);
          updateSetting("productTourDismissedAt", null);
          launchTour({ force: true });
        },
      },
      onDismiss: () => {
        if (missedAcceptedRef.current) return;
        if (settingsRef.current.productTourCompleted === null) {
          markDismissed();
        }
      },
    });
  }, [
    demo,
    isGuest,
    roleLoading,
    role,
    isFoldersView,
    settings,
    showToast,
    t,
    updateSetting,
    launchTour,
    markDismissed,
  ]);

  return null;
};
