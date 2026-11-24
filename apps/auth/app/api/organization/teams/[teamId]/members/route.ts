import { canManageTeam } from "@hosanna/auth";
import { withAuthCors } from "@hosanna/auth/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

const memberSchema = z.object({ userId: z.string().min(1) });
type RouteContext = { params: Promise<{ teamId: string }> };

async function authorize(req: Request, context: RouteContext) {
  const { teamId } = await context.params;
  const ctx = await requireAuthSession();
  if (!ctx.organizationId || !ctx.role)
    throw new AuthHttpError(403, "An active organization is required.");
  const team = await prisma.team.findFirst({
    where: { id: teamId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!team) throw new AuthHttpError(404, "Team not found");
  const isTeamMember = Boolean(
    await prisma.teamMember.findFirst({
      where: { teamId, userId: ctx.userId },
      select: { id: true },
    }),
  );
  if (!canManageTeam({ role: ctx.role, action: "update", isTeamMember }))
    throw new AuthHttpError(403, "Missing permission");
  const parsed = memberSchema.safeParse(await req.json());
  if (!parsed.success)
    throw new AuthHttpError(400, parsed.error.issues[0]?.message ?? "Invalid member");
  return { ctx, team, userId: parsed.data.userId };
}

async function addMember(req: Request, context: RouteContext) {
  try {
    const { ctx, team, userId } = await authorize(req, context);
    const orgMember = await prisma.member.findFirst({
      where: { organizationId: ctx.organizationId!, userId },
      select: { id: true },
    });
    if (!orgMember) throw new AuthHttpError(404, "Organization member not found");
    const existing = await prisma.teamMember.findFirst({
      where: { teamId: team.id, userId },
      select: { id: true },
    });
    if (existing) throw new AuthHttpError(409, "Member is already on this team");
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          id: crypto.randomUUID(),
          teamId: team.id,
          userId,
          membershipKey: `${team.id}_${userId}`,
        },
      }),
      prisma.team.update({ where: { id: team.id }, data: { memberCount: { increment: 1 } } }),
    ]);
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

async function removeMember(req: Request, context: RouteContext) {
  try {
    const { ctx, team, userId } = await authorize(req, context);
    const orgMember = await prisma.member.findFirst({
      where: { organizationId: ctx.organizationId!, userId },
      select: { id: true },
    });
    if (!orgMember) throw new AuthHttpError(404, "Organization member not found");
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: team.id, userId },
      select: { id: true },
    });
    if (!membership) throw new AuthHttpError(404, "Team member not found");
    await prisma.$transaction([
      prisma.teamMember.delete({ where: { id: membership.id } }),
      prisma.team.update({ where: { id: team.id }, data: { memberCount: { decrement: 1 } } }),
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

export const POST = addMember;
export const DELETE = removeMember;
export const OPTIONS = withAuthCors(() => Promise.resolve(Response.json({ ok: true })));
