/**
 * Modular product-tour blocks.
 *
 * Each block is gated by permissions (and optional feature flags). Roles get a
 * custom tour simply by having a different permission set — plus optional
 * `customScript` hooks for special interactions later.
 */

import type { TourBlockDefinition } from "./types";

export const PRODUCT_TOUR_BLOCKS: TourBlockDefinition[] = [
  {
    id: "welcome",
    element: "[data-tour='sidebar']",
    side: "right",
    align: "start",
  },
  {
    id: "nav.drive",
    element: "[data-tour='nav-drive']",
    side: "right",
    align: "start",
  },
  {
    id: "nav.library",
    element: "[data-tour='nav-library']",
    requireAll: ["song.access"],
    side: "right",
    align: "start",
  },
  {
    id: "nav.collections",
    element: "[data-tour='nav-collections']",
    requireAll: ["collection.access"],
    side: "right",
    align: "start",
  },
  {
    id: "nav.services",
    element: "[data-tour='nav-services']",
    requireAll: ["service.access"],
    side: "right",
    align: "start",
  },
  {
    id: "nav.agenda",
    element: "[data-tour='nav-agenda']",
    requireAll: ["agenda.access"],
    side: "right",
    align: "start",
  },
  {
    id: "toolbar.search",
    element: "[data-tour='toolbar-search']",
    side: "bottom",
    align: "end",
  },
  {
    id: "toolbar.create",
    element: "[data-tour='toolbar-create']",
    requireAny: [
      "song.create",
      "folder.create",
      "service.create",
      "collection.create",
      "agenda.create",
      "song.import",
    ],
    side: "bottom",
    align: "end",
  },
  {
    id: "nav.settings",
    element: "[data-tour='nav-user-menu']",
    side: "top",
    align: "start",
  },
  {
    id: "finish",
    element: "[data-tour='sidebar']",
    side: "right",
    align: "center",
    customScript: "offer-interactive-onboarding",
  },
];
