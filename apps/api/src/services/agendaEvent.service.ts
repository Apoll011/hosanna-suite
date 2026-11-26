// SPDX-License-Identifier: AGPL-3.0-only
import { Prisma } from "@hosanna/db";
import type { OrgScopedPrisma } from "../database/prisma.js";
import { DEFAULT_LOCALE, t } from "../lib/i18n.js";
import { AppError } from "../utils/errors.js";

export class AgendaEventService {
  constructor(
    private readonly db: OrgScopedPrisma,
    private readonly locale: string = DEFAULT_LOCALE,
  ) {}

  async list(query: { from?: string; to?: string; limit?: number } = {}) {
    const limit = Math.min(Math.max(Number(query.limit) || 200, 1), 500);
    const dateFilter: Prisma.StringFilter = {};
    if (query.from) dateFilter.gte = query.from;
    if (query.to) dateFilter.lte = query.to;

    const where: Prisma.AgendaEventWhereInput = {
      deleted: false,
      ...(query.from || query.to ? { date: dateFilter } : {}),
    };

    return this.db.agendaEvent.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: limit,
    });
  }

  async getById(id: string) {
    const event = await this.db.agendaEvent.findFirst({
      where: { id, deleted: false },
    });
    if (!event) {
      throw AppError.notFound("AGENDA_EVENT_NOT_FOUND", t(this.locale, "agenda.not_found"));
    }
    return event;
  }
}
