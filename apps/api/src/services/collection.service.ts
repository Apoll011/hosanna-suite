// SPDX-License-Identifier: AGPL-3.0-only
import type { OrgScopedPrisma } from "../database/prisma.js";
import { DEFAULT_LOCALE, t } from "../lib/i18n.js";
import { AppError } from "../utils/errors.js";

export class CollectionService {
  constructor(
    private readonly db: OrgScopedPrisma,
    private readonly locale: string = DEFAULT_LOCALE,
  ) {}

  async list() {
    const collections = await this.db.collection.findMany({
      where: { deleted: false },
      select: {
        id: true,
        orgId: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { songs: { where: { deleted: false } } } },
      },
      orderBy: { name: "asc" },
    });

    return collections.map(({ _count, ...rest }) => ({
      ...rest,
      songCount: _count.songs,
    }));
  }

  async getById(id: string) {
    const collection = await this.db.collection.findFirst({
      where: { id, deleted: false },
      include: {
        _count: { select: { songs: { where: { deleted: false } } } },
        songs: {
          where: { deleted: false },
          select: { id: true, title: true, artist: true },
          orderBy: { title: "asc" },
        },
      },
    });
    if (!collection) {
      throw AppError.notFound("COLLECTION_NOT_FOUND", t(this.locale, "collection.not_found"));
    }
    const { _count, ...rest } = collection;
    return {
      ...rest,
      songCount: _count.songs,
    };
  }
}
