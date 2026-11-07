/**
 * Demo Mode — database seeder.
 *
 * Inserts all generated demo documents into the RxDB collections.
 * Safe to call multiple times in the same session — idempotent via
 * the `demo_seeded` sessionStorage flag.
 */

import type { HosanaDatabase } from "../db/database";
import { generateDemoData } from "./demoData";
import { isDemoSeeded, markDemoSeeded } from "./index";

/**
 * Hydrates the local RxDB database with demo data.
 *
 * @param db     The live HosanaDatabase instance.
 * @param locale Browser locale string (e.g. "pt-BR", "en-US", "es").
 */
export async function seedDemoDatabase(
  db: HosanaDatabase,
  locale: string,
): Promise<void> {
  if (isDemoSeeded()) return;

  const { folders, songs, collections, services, agendaEvents } =
    generateDemoData(locale);

  // Engine collections require `T & Record<string, unknown>`; domain types
  // (Folder/Song/…) are structurally compatible at runtime.
  type Upsertable = { id: string } & Record<string, unknown>;
  const asUpsertable = <T extends { id: string }>(doc: T): Upsertable =>
    doc as unknown as Upsertable;

  const upsertDoc = (
    collection: { upsert: (doc: Upsertable) => Promise<unknown> },
    doc: Upsertable,
  ) =>
    collection.upsert(doc).catch(() => {
      /* already exists — ignore */
    });

  // Bulk-insert each collection, skipping docs that already exist.
  await Promise.all([
    ...folders.map((doc) => upsertDoc(db.folders, asUpsertable(doc))),
    ...songs.map((doc) => upsertDoc(db.songs, asUpsertable(doc))),
    ...collections.map((doc) => upsertDoc(db.collections, asUpsertable(doc))),
    ...services.map((doc) => upsertDoc(db.services, asUpsertable(doc))),
    ...agendaEvents.map((doc) => upsertDoc(db.agendaEvents, asUpsertable(doc))),
  ]);

  markDemoSeeded();
}
