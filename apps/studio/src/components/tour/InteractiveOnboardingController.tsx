/**
 * Starts the wait-for-action interactive onboarding inside an isolated demo tab.
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { isDemoMode } from "@/src/demo";
import { usePersonalSettings } from "@/src/hooks/usePersonalSettings";
import { deriveView } from "@/src/layouts/view";
import { useI18n } from "@/src/lib/i18n";
import {
  emitOnboardingEvent,
  getInteractiveOnboardingRole,
  isInteractiveOnboardingRunning,
  isInteractiveOnboardingSession,
  refreshInteractiveOnboarding,
  runInteractiveOnboarding,
} from "@/src/lib/tour";
import React, { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

export const InteractiveOnboardingController: React.FC = () => {
  const { t } = useI18n();
  const location = useLocation();
  const { organization } = useAuth();
  const { updateSetting } = usePersonalSettings();
  const startedRef = useRef(false);

  const slugPrefix = organization?.slug ? `/${organization.slug}` : "";
  const view = useMemo(
    () => deriveView(location.pathname, slugPrefix),
    [location.pathname, slugPrefix],
  );

  useEffect(() => {
    if (!isDemoMode() || !isInteractiveOnboardingSession()) return;
    if (view === "explorer") emitOnboardingEvent("navigated-folders");
    if (view === "songs") emitOnboardingEvent("navigated-songs");
    if (view === "collections" || view === "collection-detail") {
      emitOnboardingEvent("navigated-collections");
    }
    if (view === "services" || view === "service-editor") {
      emitOnboardingEvent("navigated-services");
      if (view === "service-editor") emitOnboardingEvent("service-opened");
    }
    if (view === "agenda") emitOnboardingEvent("navigated-agenda");
    if (view === "song-editor") emitOnboardingEvent("song-opened");
  }, [view]);

  // Keep the spotlight alive after Drive → Library → editor (etc.).
  useEffect(() => {
    if (!isDemoMode() || !isInteractiveOnboardingSession()) return;
    if (!isInteractiveOnboardingRunning()) return;
    refreshInteractiveOnboarding();
  }, [location.pathname]);

  useEffect(() => {
    if (!isDemoMode() || !isInteractiveOnboardingSession()) return;
    if (startedRef.current || isInteractiveOnboardingRunning()) return;
    if (view !== "explorer") return;

    startedRef.current = true;
    const role = getInteractiveOnboardingRole();
    const timer = window.setTimeout(() => {
      void runInteractiveOnboarding({
        role,
        collectionsEnabled: true,
        agendaEnabled: true,
        t,
        labels: {
          next: t("tour.interactive.controls.next"),
          skipStep: t("tour.interactive.controls.skipStep"),
          skipTour: t("tour.interactive.controls.skipTour"),
          waiting: t("tour.interactive.controls.waiting"),
          done: t("tour.interactive.controls.done"),
          progress: t("tour.interactive.controls.progress"),
        },
        onCompleted: () => {
          updateSetting("interactiveOnboardingCompleted", true);
        },
        onDismissed: () => {
          // User can relaunch via /demo?onboarding=1
        },
      });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [view, t, updateSetting]);

  return null;
};
