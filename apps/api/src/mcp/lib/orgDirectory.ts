import { RESPONSIBILITIES } from "@hosanna/auth";
import { randomUUID } from "node:crypto";
import { prisma } from "../../database/prisma.js";
import { requireWriteEntitlement, type McpContext } from "../context.js";

export type OrgAssignee = {
  id: string;
  name: string;
  /** Optional — link to an existing org member when known. */
  memberId?: string;
  avatarUrl?: string;
  /** True when there is no memberId (external / guest name). */
  unlinked?: boolean;
};

export type OrgResponsibility = {
  id: string;
  categoryId: string;
  assignees: OrgAssignee[];
};

type OrgMeta = {
  locale?: string;
  shortName?: string;
  settings?: {
    general?: { locale?: string; timezone?: string };
    agenda?: {
      responsibilityCategories?: Array<{
        id: string;
        label: string;
        icon?: string;
        color?: string;
      }>;
    };
  };
};

function parseOrgMeta(metadata: unknown): OrgMeta {
  try {
    const meta = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    return (meta && typeof meta === "object" ? meta : {}) as OrgMeta;
  } catch {
    return {};
  }
}

function localeKey(locale: string): keyof typeof RESPONSIBILITIES {
  if (locale.startsWith("pt")) return "pt-PT";
  if (locale.startsWith("es")) return "es";
  return "en";
}

/** Current user + org membership for "who am I?" */
export async function getMe(ctx: McpContext) {
  const [member, org] = await Promise.all([
    prisma.member.findFirst({
      where: { organizationId: ctx.orgId, userId: ctx.user.id },
      select: {
        id: true,
        role: true,
        userId: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    }),
    prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { id: true, name: true, slug: true, logo: true, metadata: true },
    }),
  ]);

  if (!member || !org) {
    throw new Error("Membership or organization not found for this session");
  }

  const meta = parseOrgMeta(org.metadata);
  return {
    user: {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      imageUrl: compactImageRef(member.user.image),
      hasImage: Boolean(member.user.image),
    },
    member: {
      id: member.id,
      role: member.role,
      userId: member.userId,
    },
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: compactImageRef(org.logo),
      hasLogo: Boolean(org.logo),
      locale: meta.settings?.general?.locale ?? meta.locale ?? ctx.locale,
      timezone: meta.settings?.general?.timezone ?? "Europe/Lisbon",
    },
    entitled: ctx.entitled,
  };
}

/** Never return data: URIs / base64 blobs to the model — only http(s) URLs. */
function compactImageRef(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("data:")) return null;
  if (v.length > 2_048) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return null;
}

export async function listMembers(
  ctx: McpContext,
  args?: { search?: string; role?: string; limit?: number },
) {
  const limit = Math.min(args?.limit ?? 100, 200);
  const search = args?.search?.trim();
  const role = args?.role?.trim();

  const members = await prisma.member.findMany({
    where: {
      organizationId: ctx.orgId,
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      role: true,
      userId: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return {
    members: members.map((m) => ({
      memberId: m.id,
      userId: m.userId,
      role: m.role,
      name: m.user.name,
      email: m.user.email,
      imageUrl: compactImageRef(m.user.image),
      hasImage: Boolean(m.user.image),
      createdAt: m.createdAt.toISOString(),
    })),
    count: members.length,
  };
}

function serializeMemberRow(m: {
  id: string;
  role: string;
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}) {
  return {
    memberId: m.id,
    userId: m.userId,
    role: m.role,
    name: m.user.name,
    email: m.user.email,
    imageUrl: compactImageRef(m.user.image),
    hasImage: Boolean(m.user.image),
    createdAt: m.createdAt.toISOString(),
  };
}

/**
 * Preflight: optionally map people names to memberIds.
 * Exact name match preferred; a single partial match counts as resolved;
 * zero or multiple matches → unresolved (+ candidates).
 * Unresolved names are still valid agenda assignees (name only) — never block.
 * Inviting people into the org is a separate tool (`members_invite`) — not part of agenda.
 */
export async function resolveMembers(
  ctx: McpContext,
  names: Array<{ name: string; category?: string }>,
) {
  const all = await prisma.member.findMany({
    where: { organizationId: ctx.orgId },
    select: {
      id: true,
      role: true,
      userId: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    take: 500,
  });

  const resolved: Array<{
    name: string;
    category?: string;
    memberId: string;
    email: string;
    role: string;
    match: "exact" | "partial";
  }> = [];
  const unresolved: Array<{
    name: string;
    category?: string;
    reason: "not_found" | "ambiguous";
    candidates: ReturnType<typeof serializeMemberRow>[];
    nameOnlyOk: true;
  }> = [];

  for (const entry of names) {
    const raw = entry.name?.trim();
    if (!raw) continue;
    const needle = raw.toLowerCase();
    const exact = all.filter((m) => m.user.name.trim().toLowerCase() === needle);
    const partial = all.filter((m) => m.user.name.toLowerCase().includes(needle));
    const pool = exact.length ? exact : partial;
    const matchKind = exact.length ? ("exact" as const) : ("partial" as const);

    if (pool.length === 1) {
      const m = pool[0]!;
      resolved.push({
        name: raw,
        category: entry.category,
        memberId: m.id,
        email: m.user.email,
        role: m.role,
        match: matchKind,
      });
    } else if (pool.length === 0) {
      unresolved.push({
        name: raw,
        category: entry.category,
        reason: "not_found",
        candidates: [],
        nameOnlyOk: true,
      });
    } else {
      unresolved.push({
        name: raw,
        category: entry.category,
        reason: "ambiguous",
        candidates: pool.slice(0, 8).map(serializeMemberRow),
        nameOnlyOk: true,
      });
    }
  }

  const allResolved = unresolved.length === 0;
  return {
    resolved,
    unresolved,
    allResolved,
    nameOnlyOk: true as const,
    tip: allResolvedTip(allResolved, unresolved.length),
  };
}

function allResolvedTip(ok: boolean, unresolvedCount: number): string {
  return ok
    ? "All names matched org members — you may pass memberId. Name-only assignees remain valid too."
    : `${unresolvedCount} name(s) are not org members. Assign them by name on the agenda anyway; after saving, you may mention they have no account. Do not block the agenda or call members_invite unless the user asks to invite someone.`;
}

/**
 * Invite by email via the auth app HTTP API (sends the invitation email).
 * Slim in-API Better Auth has no mail — never create invitations locally.
 */
export async function inviteMember(
  ctx: McpContext,
  args: { email: string; name?: string; role?: string; resend?: boolean },
) {
  requireInvitePermission(ctx);
  requireWriteEntitlement(ctx);
  const email = args.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Valid email is required for members_invite");
  }
  const role = (args.role?.trim() || "musician").toLowerCase();
  const allowed = new Set(["admin", "teamLeader", "editor", "musician", "member", "guest"]);
  if (!allowed.has(role)) {
    throw new Error(`Invalid role "${role}". Use musician, editor, admin, guest, …`);
  }
  if (!ctx.token) {
    throw new Error("Session token required to invite via the auth app");
  }

  const existingMember = await prisma.member.findFirst({
    where: { organizationId: ctx.orgId, user: { email } },
    select: { id: true },
  });
  if (existingMember) {
    return {
      invited: false as const,
      alreadyMember: true as const,
      memberId: existingMember.id,
      email,
      hint: "User is already an org member.",
    };
  }

  const pending = await prisma.invitation.findFirst({
    where: { organizationId: ctx.orgId, email, status: "pending" },
    select: { id: true, expiresAt: true, role: true },
  });
  const resend = args.resend === true || Boolean(pending);

  const { inviteMemberViaAuthApp } = await import("../../lib/authAppClient.js");
  const result = await inviteMemberViaAuthApp({
    bearerToken: ctx.token,
    email,
    role,
    organizationId: ctx.orgId,
    resend,
  });

  if (!result.ok) {
    // Auth already treats pending invites specially — surface a clean payload.
    if (pending && /already invited/i.test(result.message)) {
      return {
        invited: false as const,
        alreadyPending: true as const,
        invitation: {
          id: pending.id,
          email,
          role: pending.role,
          expiresAt: pending.expiresAt.toISOString(),
          name: args.name?.trim() || null,
        },
        hint: "Invitation already pending. Pass resend=true to send the email again via the auth app.",
      };
    }
    throw new Error(result.message);
  }

  return {
    invited: true as const,
    resent: result.resent,
    invitation: {
      ...result.invitation,
      name: args.name?.trim() || null,
    },
    hint: result.resent
      ? "Invitation email resent via the auth app."
      : "Invitation created and email sent via the auth app.",
  };
}

function requireInvitePermission(ctx: McpContext): void {
  const role = ctx.user.role;
  if (role === "owner" || role === "admin" || role === "teamLeader") return;
  throw new Error("Missing permission: invitation.create (owner/admin/teamLeader only)");
}

export async function getMember(
  ctx: McpContext,
  args: { memberId?: string; userId?: string; name?: string },
) {
  if (!args.memberId && !args.userId && !args.name?.trim()) {
    throw new Error("Provide memberId, userId, or name");
  }

  const name = args.name?.trim();
  const select = {
    id: true,
    role: true,
    userId: true,
    createdAt: true,
    user: { select: { id: true, name: true, email: true, image: true } },
  } as const;

  // Exact id lookups
  if (args.memberId || args.userId) {
    const member = await prisma.member.findFirst({
      where: {
        organizationId: ctx.orgId,
        ...(args.memberId ? { id: args.memberId } : {}),
        ...(args.userId ? { userId: args.userId } : {}),
      },
      select,
    });
    if (!member) {
      return {
        notFound: true as const,
        member: null,
        suggestions: [] as ReturnType<typeof serializeMemberRow>[],
        message: "Member not found in this organization",
      };
    }
    return { notFound: false as const, member: serializeMemberRow(member) };
  }

  // Name search — surface ambiguity
  const matches = await prisma.member.findMany({
    where: {
      organizationId: ctx.orgId,
      user: { name: { contains: name!, mode: "insensitive" } },
    },
    select,
    take: 10,
    orderBy: { createdAt: "asc" },
  });

  if (matches.length === 0) {
    const loose = await prisma.member.findMany({
      where: { organizationId: ctx.orgId },
      select,
      take: 8,
      orderBy: { createdAt: "asc" },
    });
    return {
      notFound: true as const,
      member: null,
      suggestions: loose.map(serializeMemberRow),
      message: `No member matches name "${name}". suggestions are recent org members.`,
    };
  }

  if (matches.length > 1) {
    return {
      notFound: false as const,
      ambiguous: true as const,
      member: null,
      candidates: matches.map(serializeMemberRow),
      message: `Multiple members match "${name}" — pick by memberId`,
    };
  }

  return {
    notFound: false as const,
    member: serializeMemberRow(matches[0]!),
  };
}

export async function getOrganization(ctx: McpContext) {
  const org = await prisma.organization.findUnique({
    where: { id: ctx.orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      metadata: true,
      createdAt: true,
    },
  });
  if (!org) throw new Error("Organization not found");

  const meta = parseOrgMeta(org.metadata);
  const locale = meta.settings?.general?.locale ?? meta.locale ?? ctx.locale;
  const builtIn = RESPONSIBILITIES[localeKey(locale)];
  const categories = meta.settings?.agenda?.responsibilityCategories?.length
    ? meta.settings.agenda.responsibilityCategories
    : builtIn.map((c) => ({
        id: c.id,
        label: c.label,
        icon: c.icon,
        color: c.color,
      }));

  const memberCount = await prisma.member.count({
    where: { organizationId: ctx.orgId },
  });

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: compactImageRef(org.logo),
      hasLogo: Boolean(org.logo),
      shortName: meta.shortName ?? null,
      locale,
      timezone: meta.settings?.general?.timezone ?? "Europe/Lisbon",
      responsibilityCategories: categories,
      memberCount,
      createdAt: org.createdAt.toISOString(),
    },
  };
}

/** Normalize responsibilities for agenda create/update. */
export function normalizeResponsibilities(input: unknown): OrgResponsibility[] {
  if (!Array.isArray(input)) return [];
  const out: OrgResponsibility[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const categoryId = typeof r.categoryId === "string" ? r.categoryId.trim() : "";
    if (!categoryId) continue;
    const assigneesRaw = Array.isArray(r.assignees) ? r.assignees : [];
    const assignees: OrgAssignee[] = [];
    for (const a of assigneesRaw) {
      if (!a || typeof a !== "object") continue;
      const asg = a as Record<string, unknown>;
      const name = typeof asg.name === "string" ? asg.name.trim() : "";
      if (!name) continue;
      const id = typeof asg.id === "string" && asg.id.trim() ? asg.id.trim() : randomUUID();
      const memberId =
        typeof asg.memberId === "string" && asg.memberId.trim() ? asg.memberId.trim() : undefined;
      const avatarUrl = typeof asg.avatarUrl === "string" ? asg.avatarUrl : undefined;
      const unlinked =
        asg.unlinked === true || (!memberId && asg.unlinked !== false) ? true : undefined;
      // Persist unlinked when there is no memberId (external / name-only assignee).
      assignees.push({
        id,
        name,
        memberId,
        avatarUrl,
        ...(memberId ? {} : { unlinked: unlinked ?? true }),
      });
    }
    out.push({
      id: typeof r.id === "string" && r.id.trim() ? r.id.trim() : randomUUID(),
      categoryId,
      assignees,
    });
  }
  return out;
}
