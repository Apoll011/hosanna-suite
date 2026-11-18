import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { POSTHOG_INIT_OPTIONS, isPostHogEnabled, resolvePostHogConfig } from "../../src/lib/posthog/helpers";
import { POSTHOG_EVENT_NAMES } from "../../src/lib/posthog/events";

describe("isPostHogEnabled", () => {
  it("is false in dev without the opt-in env flag", () => {
    assert.equal(
      isPostHogEnabled({ PROD: false, VITE_PUBLIC_POSTHOG_DEV: undefined }),
      false,
    );
  });

  it("is true in production", () => {
    assert.equal(isPostHogEnabled({ PROD: true }), true);
  });

  it("is true in dev when VITE_PUBLIC_POSTHOG_DEV is set", () => {
    assert.equal(
      isPostHogEnabled({ PROD: false, VITE_PUBLIC_POSTHOG_DEV: "true" }),
      true,
    );
  });
});

describe("resolvePostHogConfig", () => {
  it("returns null when PostHog is disabled", () => {
    assert.equal(
      resolvePostHogConfig({ PROD: false, VITE_PUBLIC_POSTHOG_KEY: "k", VITE_PUBLIC_POSTHOG_HOST: "h" }),
      null,
    );
  });

  it("returns null when the key is missing", () => {
    assert.equal(resolvePostHogConfig({ PROD: true, VITE_PUBLIC_POSTHOG_HOST: "h" }), null);
  });

  it("returns null when the host is missing", () => {
    assert.equal(resolvePostHogConfig({ PROD: true, VITE_PUBLIC_POSTHOG_KEY: "k" }), null);
  });

  it("returns { token, host } when fully configured", () => {
    assert.deepEqual(
      resolvePostHogConfig({
        PROD: true,
        VITE_PUBLIC_POSTHOG_KEY: "k",
        VITE_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
      }),
      { token: "k", host: "https://eu.i.posthog.com" },
    );
  });
});

describe("POSTHOG_INIT_OPTIONS", () => {
  it("enables all captured PostHog features", () => {
    assert.equal(POSTHOG_INIT_OPTIONS.capture_pageview, false);
    assert.equal(POSTHOG_INIT_OPTIONS.capture_pageleave, true);
    assert.equal(POSTHOG_INIT_OPTIONS.autocapture, true);
    assert.equal(POSTHOG_INIT_OPTIONS.capture_dead_clicks, true);
    assert.equal(POSTHOG_INIT_OPTIONS.capture_performance, true);
    assert.deepEqual(POSTHOG_INIT_OPTIONS.capture_exceptions, {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: true,
    });
    assert.deepEqual(POSTHOG_INIT_OPTIONS.session_recording, { maskAllInputs: true });
  });
});

describe("POSTHOG_EVENT_NAMES", () => {
  it("contains exactly the 49-event catalog", () => {
    const expected = [
      "logout",
      "org_switched",
      "theme_changed",
      "language_changed",
      "sync_status_changed",
      "tour_started",
      "tour_completed",
      "explorer_view_changed",
      "explorer_density_changed",
      "explorer_sort_changed",
      "folder_created",
      "folder_renamed",
      "folder_customized",
      "folder_moved",
      "folder_deleted",
      "folder_restored",
      "song_created",
      "song_saved",
      "song_deleted",
      "song_restored",
      "song_moved",
      "songs_batch_tagged",
      "collection_created",
      "collection_updated",
      "collection_deleted",
      "collection_restored",
      "songs_added_to_collection",
      "songs_removed_from_collection",
      "service_created",
      "service_deleted",
      "service_archived",
      "service_edited",
      "service_duplicated",
      "service_saved",
      "service_element_added",
      "service_element_removed",
      "service_element_reordered",
      "agenda_event_created",
      "agenda_event_updated",
      "agenda_event_deleted",
      "agenda_event_restored",
      "agenda_responsibility_added",
      "agenda_responsibility_assignees_changed",
      "agenda_responsibility_removed",
      "import_started",
      "import_completed",
      "import_failed",
      "print_initiated",
      "print_defaults_saved",
    ];
    assert.deepEqual([...POSTHOG_EVENT_NAMES], expected);
  });

  it("has unique snake_case names", () => {
    assert.equal(new Set(POSTHOG_EVENT_NAMES).size, POSTHOG_EVENT_NAMES.length);
    for (const name of POSTHOG_EVENT_NAMES) {
      assert.match(name, /^[a-z0-9]+(_[a-z0-9]+)*$/);
    }
  });
});
