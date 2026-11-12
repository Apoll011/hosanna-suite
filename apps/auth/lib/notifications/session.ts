import type { PermissionString } from "@hosanna/auth";
import { roles, toPermissionRequest, type AppRole } from "@hosanna/auth";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

export type AuthRequestContext = {
  userId: string;
  sessionId: string;
  organizationId: string | null;
  role: AppRole | null;
  locale: string;
};

export async function requireAuthSession(): Promise<AuthRequestContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || !session.session?.id) {
    throw new AuthHttpError(401, "Unauthenticated");
  }

  const organizationId =
    (session.session as { activeOrganizationId?: string | null }).activeOrganizationId ?? null;

  let role: AppRole | null = null;
  if (organizationId) {
    const member = await prisma.member.findFirst({
      where: { organizationId, userId: session.user.id },
      select: { role: true },
    });
    role = (member?.role?.toLowerCase() as AppRole) ?? null;
  }

  return {
    userId: session.user.id,
    sessionId: session.session.id,
    organizationId,
    role,
    locale: "pt-PT",
  };
}

export function assertPermission(ctx: AuthRequestContext, permission: PermissionString) {
  if (!ctx.role) throw new AuthHttpError(403, "An active organization is required.");
  const role = roles[ctx.role];
  if (!role || !role.authorize(toPermissionRequest(permission)).success) {
    throw new AuthHttpError(403, "Missing permission");
  }
}

export class AuthHttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthHttpError";
  }
}

export function jsonError(err: unknown): Response {
  if (err instanceof AuthHttpError) {
    return Response.json(
      { error: err.message, ...(err.code ? { code: err.code } : {}) },
      { status: err.status },
    );
  }
  console.error("[auth-api]", err);
  return Response.json(
    { error: err instanceof Error ? err.message : "Internal server error" },
    { status: 500 },
  );
}
