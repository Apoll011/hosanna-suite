import type { DispatchTarget } from "./types.js";

/**
 * Resolve dispatch targeting to a unique list of userIds.
 */
export async function resolveRecipients(prisma: any, target: DispatchTarget): Promise<string[]> {
  const { userId, organizationId, teamId, roles } = target;
  const roleFilter = roles && roles.length > 0 ? roles : null;

  if (userId) {
    if (organizationId || teamId) {
      throw new Error("Provide either userId or organizationId/teamId, not both.");
    }
    return [userId];
  }

  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, organizationId: true },
    });
    if (!team) return [];

    const teamMembers = (await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    })) as Array<{ userId: string }>;
    let userIds = Array.from(new Set(teamMembers.map((m) => m.userId)));

    if (roleFilter) {
      const members = (await prisma.member.findMany({
        where: {
          organizationId: team.organizationId,
          userId: { in: userIds },
          role: { in: roleFilter },
        },
        select: { userId: true },
      })) as Array<{ userId: string }>;
      userIds = members.map((m) => m.userId);
    }
    return userIds;
  }

  if (organizationId) {
    const members = (await prisma.member.findMany({
      where: {
        organizationId,
        ...(roleFilter ? { role: { in: roleFilter } } : {}),
      },
      select: { userId: true },
    })) as Array<{ userId: string }>;
    return Array.from(new Set(members.map((m) => m.userId)));
  }

  throw new Error("Provide userId, organizationId, or teamId.");
}
