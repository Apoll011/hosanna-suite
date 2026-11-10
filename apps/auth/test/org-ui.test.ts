import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_GENERAL,
  PRESET_COLORS,
  orgInitials,
  readOrgAppearance,
  readOrgGeneral,
  roleLabel,
} from "../lib/org-ui.ts";

const t = (key: string) => key;

describe("orgInitials", () => {
  it("returns middle-dot for empty/null/whitespace", () => {
    assert.equal(orgInitials(), "·");
    assert.equal(orgInitials(null), "·");
    assert.equal(orgInitials(""), "·");
    assert.equal(orgInitials("   "), "·");
  });

  it("uses the first letter of a single word", () => {
    assert.equal(orgInitials("Hosanna"), "H");
    assert.equal(orgInitials("alpha"), "A");
  });

  it("uses first letters of multiple words, max 2 chars", () => {
    assert.equal(orgInitials("First Baptist"), "FB");
    assert.equal(orgInitials("One Two Three"), "OT");
    assert.equal(orgInitials("a b c d"), "AB");
  });

  it("uppercases initials", () => {
    assert.equal(orgInitials("lower case"), "LC");
  });

  it("collapses internal whitespace", () => {
    assert.equal(orgInitials("  New   Hope  "), "NH");
  });
});

describe("roleLabel", () => {
  it("maps known roles to i18n keys", () => {
    assert.equal(roleLabel("owner", t), "settings.roles.owner");
    assert.equal(roleLabel("admin", t), "settings.roles.admin");
    assert.equal(roleLabel("teamLeader", t), "settings.roles.teamLeader");
    assert.equal(roleLabel("team_leader", t), "settings.roles.teamLeader");
    assert.equal(roleLabel("leader", t), "settings.roles.teamLeader");
    assert.equal(roleLabel("editor", t), "settings.roles.editor");
    assert.equal(roleLabel("musician", t), "settings.roles.musician");
    assert.equal(roleLabel("guest", t), "settings.roles.guest");
    assert.equal(roleLabel("member", t), "settings.roles.member");
  });

  it("is case-insensitive for known roles", () => {
    assert.equal(roleLabel("OWNER", t), "settings.roles.owner");
    assert.equal(roleLabel("Admin", t), "settings.roles.admin");
  });

  it("returns raw role for unknown non-empty values", () => {
    assert.equal(roleLabel("unknown", t), "unknown");
    assert.equal(roleLabel("custom-role", t), "custom-role");
  });

  it("falls back to member key for empty role", () => {
    assert.equal(roleLabel("", t), "settings.roles.member");
  });
});

describe("constants", () => {
  it("exposes DEFAULT_ACCENT_COLOR", () => {
    assert.equal(DEFAULT_ACCENT_COLOR, "#0284c7");
  });

  it("exposes DEFAULT_GENERAL defaults", () => {
    assert.deepEqual(DEFAULT_GENERAL, {
      locale: "pt-PT",
      timezone: "Europe/Lisbon",
      weekStartsOn: 1,
    });
  });

  it("exposes PRESET_COLORS with name/hex pairs", () => {
    assert.ok(PRESET_COLORS.length >= 8);
    for (const swatch of PRESET_COLORS) {
      assert.equal(typeof swatch.name, "string");
      assert.match(swatch.hex, /^#[0-9a-fA-F]{6}$/);
    }
    assert.equal(PRESET_COLORS[0].hex, DEFAULT_ACCENT_COLOR);
  });
});

describe("readOrgAppearance", () => {
  it("returns defaults for empty metadata", () => {
    assert.deepEqual(readOrgAppearance({}), {
      accentColor: DEFAULT_ACCENT_COLOR,
      showBranding: true,
    });
  });

  it("reads custom accent color", () => {
    assert.equal(
      readOrgAppearance({
        settings: { appearance: { accentColor: "#e11d48" } },
      }).accentColor,
      "#e11d48",
    );
  });

  it("ignores empty accent and falls back to default", () => {
    assert.equal(
      readOrgAppearance({
        settings: { appearance: { accentColor: "" } },
      }).accentColor,
      DEFAULT_ACCENT_COLOR,
    );
  });

  it("treats showBranding false as false", () => {
    assert.equal(
      readOrgAppearance({
        settings: { appearance: { showBranding: false } },
      }).showBranding,
      false,
    );
  });

  it("treats showBranding true/missing as true", () => {
    assert.equal(
      readOrgAppearance({
        settings: { appearance: { showBranding: true } },
      }).showBranding,
      true,
    );
    assert.equal(
      readOrgAppearance({
        settings: { appearance: {} },
      }).showBranding,
      true,
    );
  });
});

describe("readOrgGeneral", () => {
  it("returns defaults for empty metadata", () => {
    assert.deepEqual(readOrgGeneral({}), DEFAULT_GENERAL);
  });

  it("applies locale/timezone/weekStartsOn overrides", () => {
    assert.deepEqual(
      readOrgGeneral({
        settings: {
          general: {
            locale: "en-US",
            timezone: "America/New_York",
            weekStartsOn: 0,
          },
        },
      }),
      {
        locale: "en-US",
        timezone: "America/New_York",
        weekStartsOn: 0,
      },
    );
  });

  it("ignores non-string locale/timezone and non-number weekStartsOn", () => {
    assert.deepEqual(
      readOrgGeneral({
        settings: {
          general: {
            locale: 1,
            timezone: null,
            weekStartsOn: "0",
          },
        },
      }),
      DEFAULT_GENERAL,
    );
  });
});
