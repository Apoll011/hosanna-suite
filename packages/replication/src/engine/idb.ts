/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Low-level IndexedDB helpers.
 * No external dependencies. No abstractions beyond what the engine needs.
 */

// Lazy import to avoid a circular dependency with host database modules.
// We only call resetDatabase() inside event handlers, never at module-load time.
let _resetDatabase: (() => void) | null = null;
export function _registerResetDatabase(fn: () => void): void {
  _resetDatabase = fn;
}

/**
 * Open an IndexedDB database.
 *
 * Key improvements over a naive open:
 * - `onblocked` logs when another connection holds an older version.
 * - `onversionchange` / `onclose` clear the host singleton so the next open
 *   gets a fresh connection instead of a closed one.
 */
export function openIDB(
  name: string,
  version: number,
  upgrade: (db: IDBDatabase, oldVersion: number) => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);

    req.onupgradeneeded = (e) => {
      upgrade((e.target as IDBOpenDBRequest).result, e.oldVersion);
    };

    req.onsuccess = () => {
      const db = req.result;

      const onConnectionClosed = (reason: string) => {
        console.warn(`[hosana-idb] connection closed (${reason}) — resetting singleton`);
        _resetDatabase?.();
      };

      db.onversionchange = () => {
        console.warn("[hosana-idb] versionchange received — closing connection to allow upgrade");
        db.close();
        onConnectionClosed("versionchange");
      };

      db.onclose = () => {
        onConnectionClosed("close");
      };

      resolve(db);
    };

    req.onerror = () => reject(req.error);

    req.onblocked = () => {
      console.warn(
        "[hosana-idb] open blocked – another tab or connection holds the DB at an older version. " +
          "Close other tabs or reload them to unblock.",
      );
    };
  });
}

export function idbGet<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export function idbGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export function idbGetAllByIndex<T>(
  db: IDBDatabase,
  store: string,
  indexName: string,
  query: IDBKeyRange | IDBValidKey,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const idx = tx.objectStore(store).index(indexName);
    const req = idx.getAll(query);
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

/** Atomically put multiple records in a single readwrite transaction. */
export function idbBulkPut<T>(db: IDBDatabase, store: string, docs: T[]): Promise<void> {
  if (docs.length === 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    for (const doc of docs) os.put(doc);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Put a single record. */
export function idbPut<T>(db: IDBDatabase, store: string, doc: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(doc);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Delete a single record by key. */
export function idbDelete(db: IDBDatabase, store: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Atomically delete multiple records in a single readwrite transaction. */
export function idbBulkDelete(db: IDBDatabase, store: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    for (const key of keys) os.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Clear all records from a store. */
export function idbClear(db: IDBDatabase, store: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * Count records in a store (cheap IDB cursor-free count).
 * Useful for health-checks (e.g. detect accidental wipe).
 */
export function idbCount(db: IDBDatabase, store: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
