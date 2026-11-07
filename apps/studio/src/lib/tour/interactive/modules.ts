/**
 * Interactive onboarding modules — permission-gated, wait-for-action steps.
 */

import type { TranslationKey } from "../../i18n";
import type { PermissionString } from "../../permissions/permission";
import type { OnboardingEventName } from "./events";

export interface InteractiveStepDef {
  id: string;
  /** i18n keys */
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  element?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  requireAll?: PermissionString[];
  requireAny?: PermissionString[];
  when?: (ctx: {
    collectionsEnabled: boolean;
    agendaEnabled: boolean;
  }) => boolean;
  /** If set, Next stays disabled until this event fires (or user skips step). */
  waitFor?: OnboardingEventName;
  /**
   * While waiting, re-highlight this selector when `retargetOn` fires
   * (e.g. create menu → create-folder modal).
   */
  retargetOn?: OnboardingEventName;
  retargetElement?: string;
  retargetSide?: "top" | "right" | "bottom" | "left";
  /** Optional route hint shown in the popover (not auto-navigated). */
  hintRoute?: string;
  /**
   * If the target element is not in the DOM when we reach this step, skip it
   * (e.g. create-menu after the user skipped “open the + menu”).
   */
  skipIfElementMissing?: boolean;
  /**
   * Logical section id. Steps sharing a section are cascade-skipped together
   * when a gate step lists that id in `skipsSections`.
   */
  section?: string;
  /**
   * When the user skips THIS step, mark these sections so later steps that
   * belong to them are skipped (e.g. skip Collections nav → skip create
   * collection, but keep the Drive explorer section).
   */
  skipsSections?: string[];
}

export interface InteractiveModuleDef {
  id: string;
  requireAll?: PermissionString[];
  requireAny?: PermissionString[];
  when?: InteractiveStepDef["when"];
  steps: InteractiveStepDef[];
}

export const INTERACTIVE_MODULES: InteractiveModuleDef[] = [
  {
    id: "intro",
    steps: [
      {
        id: "intro.welcome",
        titleKey: "tour.interactive.intro.welcome.title",
        descriptionKey: "tour.interactive.intro.welcome.description",
        element: "[data-tour='sidebar']",
        side: "right",
        align: "start",
      },
      {
        id: "intro.sandbox",
        titleKey: "tour.interactive.intro.sandbox.title",
        descriptionKey: "tour.interactive.intro.sandbox.description",
        element: "[data-tour='sidebar']",
        side: "right",
        align: "center",
      },
    ],
  },
  {
    id: "folders",
    requireAny: ["folder.create", "folder.update", "folder.access"],
    steps: [
      {
        id: "folders.createBtn",
        titleKey: "tour.interactive.folders.createBtn.title",
        descriptionKey: "tour.interactive.folders.createBtn.description",
        element: "[data-tour='toolbar-create']",
        side: "left",
        align: "start",
        requireAny: ["folder.create"],
        waitFor: "create-menu-opened",
        skipsSections: ["folders-create"],
      },
      {
        id: "folders.create",
        titleKey: "tour.interactive.folders.create.title",
        descriptionKey: "tour.interactive.folders.create.description",
        element: "[data-tour='create-menu']",
        side: "left",
        align: "start",
        requireAll: ["folder.create"],
        waitFor: "folder-created",
        section: "folders-create",
        skipIfElementMissing: true,
        retargetOn: "create-folder-modal-opened",
        retargetElement: "[data-tour='create-folder-modal']",
        retargetSide: "bottom",
      },
      {
        id: "folders.drive",
        titleKey: "tour.interactive.folders.drive.title",
        descriptionKey: "tour.interactive.folders.drive.description",
        element: "[data-tour='nav-drive']",
        side: "right",
        align: "start",
      },
    ],
  },
  {
    id: "songs",
    requireAll: ["song.access"],
    steps: [
      {
        id: "songs.createBtn",
        titleKey: "tour.interactive.folders.createBtn.title",
        descriptionKey: "tour.interactive.folders.createBtn.description",
        element: "[data-tour='toolbar-create']",
        side: "left",
        align: "start",
        requireAll: ["song.create"],
        waitFor: "create-menu-opened",
        skipsSections: ["songs-create"],
      },
      {
        id: "songs.create",
        titleKey: "tour.interactive.songs.create.title",
        descriptionKey: "tour.interactive.songs.create.description",
        element: "[data-tour='create-menu']",
        side: "left",
        align: "start",
        requireAll: ["song.create"],
        waitFor: "song-created",
        section: "songs-create",
        skipIfElementMissing: true,
        retargetOn: "create-song-modal-opened",
        retargetElement: "[data-tour='create-song-modal']",
        retargetSide: "bottom",
      },
      {
        id: "songs.open",
        titleKey: "tour.interactive.songs.open.title",
        descriptionKey: "tour.interactive.songs.open.description",
        element: "[data-tour='nav-library']",
        side: "right",
        align: "start",
        waitFor: "song-opened",
        // Skipping “open a song” skips the whole ChordPro editor block.
        skipsSections: ["chordpro"],
        retargetOn: "navigated-songs",
        retargetElement: "[data-tour='songs-list']",
        retargetSide: "top",
      },
    ],
  },
  {
    id: "chordpro",
    requireAny: ["song.update", "song.access"],
    steps: [
      {
        id: "chordpro.editor",
        titleKey: "tour.interactive.chordpro.editor.title",
        descriptionKey: "tour.interactive.chordpro.editor.description",
        element: "[data-tour='song-editor']",
        side: "left",
        align: "start",
        section: "chordpro",
        skipIfElementMissing: true,
      },
      {
        id: "chordpro.snippets",
        titleKey: "tour.interactive.chordpro.snippets.title",
        descriptionKey: "tour.interactive.chordpro.snippets.description",
        element: "[data-tour='song-editor']",
        side: "left",
        align: "start",
        requireAll: ["song.update"],
        section: "chordpro",
        skipIfElementMissing: true,
      },
      {
        id: "chordpro.chords",
        titleKey: "tour.interactive.chordpro.chords.title",
        descriptionKey: "tour.interactive.chordpro.chords.description",
        element: "[data-tour='song-editor']",
        side: "left",
        align: "start",
        requireAll: ["song.update"],
        section: "chordpro",
        skipIfElementMissing: true,
      },
      {
        id: "chordpro.preview",
        titleKey: "tour.interactive.chordpro.preview.title",
        descriptionKey: "tour.interactive.chordpro.preview.description",
        element: "[data-tour='song-preview']",
        side: "left",
        align: "start",
        section: "chordpro",
        skipIfElementMissing: true,
      },
      {
        id: "chordpro.save",
        titleKey: "tour.interactive.chordpro.save.title",
        descriptionKey: "tour.interactive.chordpro.save.description",
        element: "[data-tour='song-save']",
        side: "bottom",
        align: "end",
        requireAll: ["song.update"],
        waitFor: "song-saved",
        section: "chordpro",
        skipIfElementMissing: true,
      },
    ],
  },
  {
    id: "collections",
    requireAll: ["collection.access"],
    steps: [
      {
        id: "collections.nav",
        titleKey: "tour.interactive.collections.nav.title",
        descriptionKey: "tour.interactive.collections.nav.description",
        element: "[data-tour='nav-collections']",
        side: "right",
        align: "start",
        waitFor: "navigated-collections",
        // Skip create-collection flow only — Drive explorer tour still runs.
        skipsSections: ["collections-setup"],
      },
      {
        id: "collections.createBtn",
        titleKey: "tour.interactive.folders.createBtn.title",
        descriptionKey: "tour.interactive.folders.createBtn.description",
        element: "[data-tour='toolbar-create']",
        side: "left",
        align: "start",
        requireAll: ["collection.create"],
        waitFor: "create-menu-opened",
        section: "collections-setup",
        skipsSections: ["collections-setup"],
      },
      {
        id: "collections.create",
        titleKey: "tour.interactive.collections.create.title",
        descriptionKey: "tour.interactive.collections.create.description",
        element: "[data-tour='create-menu']",
        side: "left",
        align: "start",
        requireAll: ["collection.create"],
        waitFor: "collection-created",
        section: "collections-setup",
        skipIfElementMissing: true,
        retargetOn: "create-collection-modal-opened",
        retargetElement: "[data-tour='create-collection-modal']",
        retargetSide: "bottom",
      },
      // --- Drive file-explorer tour (kept even if Collections page is skipped) ---
      {
        id: "collections.backToDrive",
        titleKey: "tour.interactive.collections.backToDrive.title",
        descriptionKey: "tour.interactive.collections.backToDrive.description",
        element: "[data-tour='nav-drive']",
        side: "right",
        align: "start",
        waitFor: "navigated-folders",
        section: "explorer",
      },
      {
        id: "collections.selection",
        titleKey: "tour.interactive.collections.selection.title",
        descriptionKey: "tour.interactive.collections.selection.description",
        element: "[data-tour='explorer-canvas']",
        side: "top",
        align: "center",
        waitFor: "items-selected",
        section: "explorer",
      },
      {
        id: "collections.openFolder",
        titleKey: "tour.interactive.collections.openFolder.title",
        descriptionKey: "tour.interactive.collections.openFolder.description",
        element: "[data-tour='explorer-canvas']",
        side: "top",
        align: "center",
        waitFor: "folder-opened",
        section: "explorer",
      },
      {
        id: "collections.selectAll",
        titleKey: "tour.interactive.collections.selectAll.title",
        descriptionKey: "tour.interactive.collections.selectAll.description",
        element: "[data-tour='explorer-canvas']",
        side: "top",
        align: "center",
        waitFor: "select-all",
        section: "explorer",
      },
      {
        id: "collections.contextMenu",
        titleKey: "tour.interactive.collections.contextMenu.title",
        descriptionKey: "tour.interactive.collections.contextMenu.description",
        element: "[data-tour='explorer-canvas']",
        side: "top",
        align: "center",
        waitFor: "context-menu-opened",
        section: "explorer",
        skipsSections: ["explorer-add"],
      },
      {
        id: "collections.addSongs",
        titleKey: "tour.interactive.collections.addSongs.title",
        descriptionKey: "tour.interactive.collections.addSongs.description",
        element: "[data-tour='explorer-context-menu']",
        side: "left",
        align: "start",
        waitFor: "songs-added-to-collection",
        section: "explorer-add",
        skipIfElementMissing: true,
        retargetOn: "add-to-collection-modal-opened",
        retargetElement: "[data-tour='add-to-collection-modal']",
        retargetSide: "left",
      },
    ],
  },
  {
    id: "services",
    requireAll: ["service.access"],
    steps: [
      {
        id: "services.nav",
        titleKey: "tour.interactive.services.nav.title",
        descriptionKey: "tour.interactive.services.nav.description",
        element: "[data-tour='nav-services']",
        side: "right",
        align: "start",
        waitFor: "navigated-services",
        skipsSections: ["services", "services-create", "services-builder"],
      },
      {
        id: "services.createBtn",
        titleKey: "tour.interactive.folders.createBtn.title",
        descriptionKey: "tour.interactive.folders.createBtn.description",
        element: "[data-tour='toolbar-create']",
        side: "left",
        align: "start",
        requireAll: ["service.create"],
        waitFor: "create-menu-opened",
        section: "services",
        skipsSections: ["services-create"],
      },
      {
        id: "services.create",
        titleKey: "tour.interactive.services.create.title",
        descriptionKey: "tour.interactive.services.create.description",
        element: "[data-tour='create-menu']",
        side: "left",
        align: "start",
        requireAll: ["service.create"],
        waitFor: "service-created",
        section: "services-create",
        skipIfElementMissing: true,
        retargetOn: "create-service-modal-opened",
        retargetElement: "[data-tour='create-service-modal']",
        retargetSide: "bottom",
      },
      {
        id: "services.builder",
        titleKey: "tour.interactive.services.builder.title",
        descriptionKey: "tour.interactive.services.builder.description",
        element: "[data-tour='service-builder']",
        side: "left",
        align: "start",
        requireAny: ["service.update", "service.create"],
        waitFor: "service-opened",
        section: "services",
        skipIfElementMissing: true,
        skipsSections: ["services-builder"],
      },
      {
        id: "services.elements",
        titleKey: "tour.interactive.services.elements.title",
        descriptionKey: "tour.interactive.services.elements.description",
        element: "[data-tour='service-builder']",
        side: "top",
        align: "center",
        requireAny: ["service.update", "service.create"],
        section: "services-builder",
        skipIfElementMissing: true,
      },
    ],
  },
  {
    id: "agenda",
    requireAll: ["agenda.access"],
    steps: [
      {
        id: "agenda.nav",
        titleKey: "tour.interactive.agenda.nav.title",
        descriptionKey: "tour.interactive.agenda.nav.description",
        element: "[data-tour='nav-agenda']",
        side: "right",
        align: "start",
        waitFor: "navigated-agenda",
        skipsSections: ["agenda", "agenda-create"],
      },
      {
        id: "agenda.createBtn",
        titleKey: "tour.interactive.folders.createBtn.title",
        descriptionKey: "tour.interactive.folders.createBtn.description",
        element: "[data-tour='toolbar-create']",
        side: "left",
        align: "start",
        requireAll: ["agenda.create"],
        waitFor: "create-menu-opened",
        section: "agenda",
        skipsSections: ["agenda-create"],
      },
      {
        id: "agenda.create",
        titleKey: "tour.interactive.agenda.create.title",
        descriptionKey: "tour.interactive.agenda.create.description",
        element: "[data-tour='create-menu']",
        side: "left",
        align: "start",
        requireAll: ["agenda.create"],
        waitFor: "event-created",
        section: "agenda-create",
        skipIfElementMissing: true,
        retargetOn: "create-event-modal-opened",
        retargetElement: "[data-tour='create-event-modal']",
        retargetSide: "bottom",
      },
    ],
  },
  {
    id: "finish",
    steps: [
      {
        id: "finish.done",
        titleKey: "tour.interactive.finish.done.title",
        descriptionKey: "tour.interactive.finish.done.description",
        element: "[data-tour='sidebar']",
        side: "right",
        align: "center",
      },
    ],
  },
];
