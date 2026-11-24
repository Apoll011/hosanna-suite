import { canManageTeam } from "@hosanna/auth";
import { withAuthCors } from "@hosanna/auth/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { AuthHttpError, jsonError, requireAuthSession } from "@/lib/notifications/session";

const createSchema = z.object({ name: z.string().trim().min(1).max(80) });
const MAXIMUM_TEAMS = 50;

async function listTeams() {
  try {
    const ctx = await requireAuthSession();
    if (!ctx.organizationId || !ctx.role)
      throw new AuthHttpError(403, "An active organization is required.");
    const records = await prisma.team.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
      include: {
        teammembers: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });
    const teams = records.map((team) => ({
      id: team.id,
      name: team.name,
      memberCount: team.teammembers.length,
      createdAt: team.createdAt,
      members: team.teammembers.map((membership) => ({
        id: membership.id,
        userId: membership.userId,
        name: membership.user.name,
        email: membership.user.email,
        image: membership.user.image,
      })),
    }));
    return Response.json({ teams, canCreate: canManageTeam({ role: ctx.role, action: "create" }) });
  } catch (err) {
    return jsonError(err);
  }
}

async function createTeam(req: Request) {
  try {
    const ctx = await requireAuthSession();
    if (!ctx.organizationId || !ctx.role)
      throw new AuthHttpError(403, "An active organization is required.");
    if (!canManageTeam({ role: ctx.role, action: "create" }))
      throw new AuthHttpError(403, "Missing permission");
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success)
      throw new AuthHttpError(400, parsed.error.issues[0]?.message ?? "Invalid team name");

    const existingCount = await prisma.team.count({
      where: { organizationId: ctx.organizationId },
    });
    if (existingCount >= MAXIMUM_TEAMS) {
      throw new AuthHttpError(400, "This organization has reached its team limit.");
    }

    const team = await prisma.team.create({
      data: {
        id: crypto.randomUUID(),
        name: parsed.data.name,
        organizationId: ctx.organizationId,
        createdAt: new Date(),
      },
    });
    if (ctx.role === "teamLeader") {
      await prisma.teamMember.create({
        data: {
          id: crypto.randomUUID(),
          teamId: team.id,
          userId: ctx.userId,
          membershipKey: `${team.id}_${ctx.userId}`,
        },
      });
      await prisma.team.update({ where: { id: team.id }, data: { memberCount: { increment: 1 } } });
    }
    return Response.json({ team }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

const handler = withAuthCors((req: Request) =>
  req.method === "POST" ? createTeam(req) : listTeams(),
);
export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
