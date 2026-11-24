/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LANGUAGES } from "@hosanna/i18n";
import { inboxBadgeLabel } from "../src/Inbox";
import { sharedUiT } from "../src/sharedT";

const INBOX_KEYS = [
  "title",
  "buttonTitle",
  "unreadCount",
  "markAllRead",
  "readAll",
  "all",
  "unread",
  "loading",
  "empty",
  "loadMore",
  "close",
] as const;

describe("inbox i18n", () => {
  for (const { code: language } of LANGUAGES) {
    it(`resolves every suite.inbox key in ${language}`, () => {
      const t = sharedUiT(language);
      for (const key of INBOX_KEYS) {
        assert.notEqual(t(`suite.inbox.${key}`), `suite.inbox.${key}`, `${language}: ${key}`);
      }
      assert.match(t("suite.inbox.unreadCount", { count: 3 }), /3/);
    });
  }
});

describe("inboxBadgeLabel", () => {
  it("shows the exact count up to nine", () => {
    assert.equal(inboxBadgeLabel(1), "1");
    assert.equal(inboxBadgeLabel(9), "9");
  });

  it("caps larger counts at 9+", () => {
    assert.equal(inboxBadgeLabel(10), "9+");
    assert.equal(inboxBadgeLabel(250), "9+");
  });
});
