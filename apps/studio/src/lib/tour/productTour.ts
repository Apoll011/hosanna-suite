/**
 * Product tour runner — lightweight driver.js coachmarks composed from
 * permission-gated blocks.
 */

import type { TranslationKey } from "@/src/lib/i18n";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour.css";
import { PRODUCT_TOUR_BLOCKS } from "./blocks";
import { roleHasAnyPermission, roleHasPermission } from "./permissions";
import type {
  BuildProductTourOptions,
  ResolvedTourStep,
  TourBlockId,
} from "./types";

export interface RunProductTourOptions extends BuildProductTourOptions {
  /** Called when the user finishes every step (Done). */
  onCompleted: () => void;
  /** Called when the user closes/skips without finishing. */
  onDismissed: () => void;
  /** Called from the finish step CTA — opens interactive onboarding. */
  onStartInteractive?: () => void;
  labels: {
    next: string;
    previous: string;
    done: string;
    close: string;
    progress: string;
    tryInteractive: string;
  };
}

let activeDriver: Driver | null = null;

const TITLE_KEYS: Record<TourBlockId, TranslationKey> = {
  welcome: "tour.product.welcome.title",
  "nav.drive": "tour.product.drive.title",
  "nav.library": "tour.product.library.title",
  "nav.collections": "tour.product.collections.title",
  "nav.services": "tour.product.services.title",
  "nav.agenda": "tour.product.agenda.title",
  "toolbar.search": "tour.product.search.title",
  "toolbar.create": "tour.product.create.title",
  "nav.settings": "tour.product.settings.title",
  finish: "tour.product.finish.title",
};

const DESC_KEYS: Record<TourBlockId, TranslationKey> = {
  welcome: "tour.product.welcome.description",
  "nav.drive": "tour.product.drive.description",
  "nav.library": "tour.product.library.description",
  "nav.collections": "tour.product.collections.description",
  "nav.services": "tour.product.services.description",
  "nav.agenda": "tour.product.agenda.description",
  "toolbar.search": "tour.product.search.description",
  "toolbar.create": "tour.product.create.description",
  "nav.settings": "tour.product.settings.description",
  finish: "tour.product.finish.description",
};

export function buildProductTourSteps(
  options: BuildProductTourOptions,
): ResolvedTourStep[] {
  const { role, flags, t } = options;

  return PRODUCT_TOUR_BLOCKS.filter((block) => {
    if (block.when && !block.when(flags)) return false;
    if (block.requireAll?.length) {
      if (!block.requireAll.every((p) => roleHasPermission(role, p))) {
        return false;
      }
    }
    if (block.requireAny?.length) {
      if (!roleHasAnyPermission(role, block.requireAny)) return false;
    }
    if (block.element && typeof document !== "undefined") {
      if (!document.querySelector(block.element)) return false;
    }
    return true;
  }).map((block) => ({
    id: block.id,
    element: block.element,
    side: block.side,
    align: block.align,
    customScript: block.customScript,
    title: t(TITLE_KEYS[block.id]),
    description: t(DESC_KEYS[block.id]),
  }));
}

export function isProductTourRunning(): boolean {
  return activeDriver !== null;
}

export function destroyProductTour(): void {
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }
}

export function runProductTour(options: RunProductTourOptions): boolean {
  destroyProductTour();

  const steps = buildProductTourSteps(options);
  if (steps.length === 0) return false;

  const { labels, onCompleted, onDismissed, onStartInteractive } = options;
  let completedViaDone = false;
  let handledOutcome = false;

  const markCompleted = () => {
    if (handledOutcome) return;
    handledOutcome = true;
    onCompleted();
  };

  const markDismissed = () => {
    if (handledOutcome) return;
    handledOutcome = true;
    onDismissed();
  };

  const driveSteps: DriveStep[] = steps.map((step, index) => {
    const isLast = index === steps.length - 1;
    return {
      element: step.element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side,
        align: step.align,
        showButtons: ["previous", "next", "close"],
        nextBtnText: isLast ? labels.done : labels.next,
        prevBtnText: labels.previous,
        doneBtnText: labels.done,
        progressText: labels.progress,
        onPopoverRender: (popover) => {
          if (!isLast || step.customScript !== "offer-interactive-onboarding") {
            return;
          }
          if (!onStartInteractive) return;
          if (popover.wrapper.querySelector("[data-tour-interactive-cta]")) {
            return;
          }
          const btn = document.createElement("button");
          btn.type = "button";
          btn.dataset.tourInteractiveCta = "true";
          btn.className = "hosana-tour-interactive-btn";
          btn.textContent = labels.tryInteractive;
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            completedViaDone = true;
            destroyProductTour();
            markCompleted();
            onStartInteractive();
          });
          popover.footerButtons.appendChild(btn);
        },
      },
    };
  });

  activeDriver = driver({
    steps: driveSteps,
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: "rgba(15, 23, 42, 0.55)",
    stagePadding: 8,
    stageRadius: 12,
    popoverClass: "hosana-driver-popover",
    nextBtnText: labels.next,
    prevBtnText: labels.previous,
    doneBtnText: labels.done,
    progressText: labels.progress,
    onDestroyStarted: () => {
      if (!activeDriver) return;
      activeDriver.destroy();
    },
    onDestroyed: () => {
      activeDriver = null;
      if (completedViaDone) {
        markCompleted();
      } else {
        markDismissed();
      }
    },
    onNextClick: (_el, _step, { driver: d }) => {
      if (d.isLastStep()) {
        completedViaDone = true;
        d.destroy();
        return;
      }
      d.moveNext();
    },
  });

  activeDriver.drive();
  return true;
}
