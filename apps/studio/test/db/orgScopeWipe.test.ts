// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { clearReplicationState } from "@hosanna/replication/replication";
import {
  PROD_CHECKPOINT_DB_NAME,
  PROD_CHECKPOINT_LS_PREFIX,
  PROD_EPOCH_LS_KEY,
} from "../../src/db/dbNames";

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const mock = {
    get length() {
      return store.size;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: mock,
    configurable: true,
    writable: true,
  });
  return mock;
}

describe("Studio replication checkpoint wipe on org switch / logout", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it("clears checkpoint localStorage keys and population epoch", async () => {
    const storage = {
      checkpointDbName: () => PROD_CHECKPOINT_DB_NAME,
      checkpointLsPrefix: () => PROD_CHECKPOINT_LS_PREFIX,
      epochLsKey: () => PROD_EPOCH_LS_KEY,
    };

    localStorage.setItem(
      `${PROD_CHECKPOINT_LS_PREFIX}_songs`,
      JSON.stringify({ updatedAt: 100, id: "s1" }),
    );
    localStorage.setItem(
      `${PROD_CHECKPOINT_LS_PREFIX}_services`,
      JSON.stringify({ updatedAt: 200, id: "svc1" }),
    );
    localStorage.setItem(PROD_EPOCH_LS_KEY, String(Date.now()));
    localStorage.setItem("unrelated_key", "keep-me");

    assert.ok(localStorage.getItem(PROD_EPOCH_LS_KEY) !== null);
    assert.ok(localStorage.getItem(`${PROD_CHECKPOINT_LS_PREFIX}_songs`) !== null);

    await clearReplicationState(storage);

    assert.equal(localStorage.getItem(`${PROD_CHECKPOINT_LS_PREFIX}_songs`), null);
    assert.equal(localStorage.getItem(`${PROD_CHECKPOINT_LS_PREFIX}_services`), null);
    assert.equal(localStorage.getItem(PROD_EPOCH_LS_KEY), null);
    assert.equal(localStorage.getItem("unrelated_key"), "keep-me");
  });
});
