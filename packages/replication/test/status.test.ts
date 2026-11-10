import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeStatusSubject } from "../src/replication/status.js";
import type { ReplicationSyncState } from "../src/replication/types.js";

describe("makeStatusSubject", () => {
  it("notifies subscribers and supports unsubscribe", () => {
    const subject = makeStatusSubject();
    const seen: ReplicationSyncState[] = [];
    const sub = subject.subscribe((s) => seen.push(s));

    subject.next("syncing");
    assert.deepEqual(seen, ["syncing"]);

    sub.unsubscribe();
    subject.next("synced");
    assert.deepEqual(seen, ["syncing"]);
  });

  it("fans out to multiple listeners", () => {
    const subject = makeStatusSubject();
    let a = 0;
    let b = 0;
    subject.subscribe(() => a++);
    subject.subscribe(() => b++);
    subject.next("error");
    assert.equal(a, 1);
    assert.equal(b, 1);
  });
});
