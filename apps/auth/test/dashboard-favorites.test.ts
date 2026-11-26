import assert from "node:assert/strict";
import test from "node:test";
import { mergeLegacyFavorites } from "../lib/dashboard/favorites";

test("legacy favorites copy into the scope without changing selection", () => {
  assert.deepEqual(
    mergeLegacyFavorites({ favorites: [], migrated: false, legacyFavorites: ["music", "auth"] }),
    { favorites: ["music", "auth"], migrated: true },
  );
});

test("existing and later-empty favorites never get repopulated from the legacy key", () => {
  assert.deepEqual(
    mergeLegacyFavorites({ favorites: ["music"], migrated: false, legacyFavorites: ["auth"] }),
    { favorites: ["music"], migrated: true },
  );
  assert.deepEqual(
    mergeLegacyFavorites({ favorites: [], migrated: true, legacyFavorites: ["auth"] }),
    { favorites: [], migrated: true },
  );
});
