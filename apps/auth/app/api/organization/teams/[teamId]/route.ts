import { canManageTeam } from "@hosanna/auth";
import { withAuthCors } from "@hosanna/auth/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

const updateSchema = z.object({ name: z.string().trim().min(1).max(80) });

type RouteContext = { params: Promise<{ teamId: string }> };

async function authorizeTeam(teamId: string, action: "update" | "delete") {
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
  if (!canManageTeam({ role: ctx.role, action, isTeamMember })) {
    throw new AuthHttpError(403, "Missing permission");
  }
  return { ctx, team };
}

async function updateTeam(req: Request, context: RouteContext) {
  try {
    const { teamId } = await context.params;
    const { team } = await authorizeTeam(teamId, "update");
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success)
      throw new AuthHttpError(400, parsed.error.issues[0]?.message ?? "Invalid team name");
    const updated = await prisma.team.update({
      where: { id: team.id },
      data: { name: parsed.data.name },
    });
    return Response.json({ team: updated });
  } catch (err) {
    return jsonError(err);
  }
}

async function deleteTeam(_req: Request, context: RouteContext) {
  try {
    const { teamId } = await context.params;
    const { team, ctx } = await authorizeTeam(teamId, "delete");
    await prisma.team.delete({ where: { id: team.id } });
    if (ctx.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: ctx.sessionId },
        select: { activeTeamId: true },
      });
      if (session?.activeTeamId === team.id) {
        await prisma.session.update({ where: { id: ctx.sessionId }, data: { activeTeamId: null } });
      }
    }
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}

export const PATCH = updateTeam;
export const DELETE = deleteTeam;

export const OPTIONS = withAuthCors(() => Promise.resolve(Response.json({ ok: true })));
