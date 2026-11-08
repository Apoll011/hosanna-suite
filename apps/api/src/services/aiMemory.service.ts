import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/errors.js";
import {
  AI_LIMITS,
  normalizeMemoryContent,
  type AiMemoryEntry,
} from "./aiBehavior.js";

export type AiMemoryScope = "organization" | "personal";

export type AiMemoryRow = AiMemoryEntry & {
  source: string;
  createdAt: Date;
  scope: AiMemoryScope;
};

export class AiMemoryService {
  async listOrg(orgId: string): Promise<AiMemoryRow[]> {
    const rows = await prisma.orgAiMemory.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, content: true, source: true, createdAt: true },
    });
    return rows.map((row) => ({ ...row, scope: "organization" as const }));
  }

  async listPersonal(userId: string): Promise<AiMemoryRow[]> {
    const rows = await prisma.userAiMemory.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, content: true, source: true, createdAt: true },
    });
    return rows.map((row) => ({ ...row, scope: "personal" as const }));
  }

  /** Org + personal entries for prompt injection (org first). */
  async listForChat(orgId: string, userId: string): Promise<AiMemoryRow[]> {
    const [org, personal] = await Promise.all([
      this.listOrg(orgId),
      this.listPersonal(userId),
    ]);
    return [...org, ...personal];
  }

  /** @deprecated Prefer listOrg — kept for call sites during transition. */
  async list(orgId: string): Promise<AiMemoryRow[]> {
    return this.listOrg(orgId);
  }

  async addOrg(
    orgId: string,
    content: string,
    meta: { source: "admin" | "ai"; userId?: string },
  ): Promise<AiMemoryRow & { duplicate: boolean }> {
    const text = normalizeMemoryContent(content);
    if (!text) throw AppError.badRequest("Memory entry is empty.");

    const existing = await this.listOrg(orgId);
    const dupe = existing.find(
      (e) => e.content.toLowerCase() === text.toLowerCase(),
    );
    if (dupe) return { ...dupe, duplicate: true };
    if (existing.length >= AI_LIMITS.memoryMaxEntries) {
      throw AppError.badRequest(
        `Organization memory is full (${AI_LIMITS.memoryMaxEntries} entries). Forget one first.`,
      );
    }
    const row = await prisma.orgAiMemory.create({
      data: {
        orgId,
        content: text,
        source: meta.source,
        createdBy: meta.userId ?? null,
      },
      select: { id: true, content: true, source: true, createdAt: true },
    });
    return { ...row, scope: "organization", duplicate: false };
  }

  async addPersonal(
    userId: string,
    content: string,
    meta: { source: "user" | "ai" },
  ): Promise<AiMemoryRow & { duplicate: boolean }> {
    const text = normalizeMemoryContent(content);
    if (!text) throw AppError.badRequest("Memory entry is empty.");

    const existing = await this.listPersonal(userId);
    const dupe = existing.find(
      (e) => e.content.toLowerCase() === text.toLowerCase(),
    );
    if (dupe) return { ...dupe, duplicate: true };
    if (existing.length >= AI_LIMITS.memoryMaxEntries) {
      throw AppError.badRequest(
        `Personal memory is full (${AI_LIMITS.memoryMaxEntries} entries). Forget one first.`,
      );
    }
    const row = await prisma.userAiMemory.create({
      data: {
        userId,
        content: text,
        source: meta.source,
      },
      select: { id: true, content: true, source: true, createdAt: true },
    });
    return { ...row, scope: "personal", duplicate: false };
  }

  /** @deprecated Prefer addOrg. */
  async add(
    orgId: string,
    content: string,
    meta: { source: "admin" | "ai"; userId?: string },
  ): Promise<AiMemoryRow & { duplicate: boolean }> {
    return this.addOrg(orgId, content, meta);
  }

  async removeOrg(orgId: string, id: string): Promise<boolean> {
    const res = await prisma.orgAiMemory.deleteMany({ where: { id, orgId } });
    return res.count > 0;
  }

  async removePersonal(userId: string, id: string): Promise<boolean> {
    const res = await prisma.userAiMemory.deleteMany({
      where: { id, userId },
    });
    return res.count > 0;
  }

  /** @deprecated Prefer removeOrg. */
  async remove(orgId: string, id: string): Promise<boolean> {
    return this.removeOrg(orgId, id);
  }

  async clearOrg(orgId: string): Promise<number> {
    const res = await prisma.orgAiMemory.deleteMany({ where: { orgId } });
    return res.count;
  }

  async clearPersonal(userId: string): Promise<number> {
    const res = await prisma.userAiMemory.deleteMany({ where: { userId } });
    return res.count;
  }

  /** @deprecated Prefer clearOrg. */
  async clear(orgId: string): Promise<number> {
    return this.clearOrg(orgId);
  }
}
