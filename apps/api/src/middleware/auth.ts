import { AppRole, PermissionString, roles, toPermissionRequest } from "@hosanna/auth";
import { createCache } from "@hosanna/cache";
import type { NextFunction, Request, Response } from "express";
import { createHash } from "node:crypto";
import { forOrganization, prisma } from "../database/prisma.js";
import { DEFAULT_LOCALE } from "../lib/i18n.js";
import { getSession, type SessionResult } from "../lib/session.js";
import { AuthorizedUser } from "../types/express.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

export interface DeniedResponse {
  status?: number;
  body?: Record<string, unknown> | ((req: Request) => Record<string, unknown>);
}

export interface MiddlewareOptions {
  onUnauthenticated?: DeniedResponse;
  onForbidden?: DeniedResponse;
}

const DEFAULT_UNAUTHENTICATED: DeniedResponse = {
  status: 401,
  body: { error: "Unauthenticated" },
};

const DEFAULT_FORBIDDEN: DeniedResponse = {
  status: 403,
  body: { error: "Missing permission" },
};

function send(res: Response, req: Request, denied: DeniedResponse) {
  const body = typeof denied.body === "function" ? denied.body(req) : denied.body;
  res.status(denied.status ?? 403).json(body ?? { error: "Forbidden" });
}

/** Checks a single permission string against a role. Usable outside Express too. */
export function can(user: Pick<AuthorizedUser, "role">, permission: PermissionString): boolean {
  const roleName = user.role?.toLowerCase() as AppRole;
  const role = roles[roleName];
  if (!role) return false;
  return role.authorize(toPermissionRequest(permission)).success;
}

export function cannot(user: Pick<AuthorizedUser, "role">, permission: PermissionString): boolean {
  return !can(user, permission);
}

function requireUser(
  req: Request,
  res: Response,
  options: MiddlewareOptions,
): req is Request & { user: AuthorizedUser } {
  if (!req.user) {
    send(res, req, options.onUnauthenticated ?? DEFAULT_UNAUTHENTICATED);
    return false;
  }
  return true;
}

export function assertUser(
  req: Request,
  res: Response,
  next: NextFunction,
): asserts req is Request & { user: AuthorizedUser } {
  if (!req.user) {
    return send(res, req, DEFAULT_UNAUTHENTICATED);
  }
  next();
}

/** router.post("/songs", requirePermission("song.create"), ...) */
export function requirePermission(permission: PermissionString, options: MiddlewareOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!requireUser(req, res, options)) return;
    if (!can(req.user, permission)) {
      return send(res, req, options.onForbidden ?? DEFAULT_FORBIDDEN);
    }
    next();
  };
}

export function requireAllPermissions(
  permissions: PermissionString[],
  options: MiddlewareOptions = {},
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!requireUser(req, res, options)) return;
    const ok = permissions.every((permission) => can(req.user!, permission));
    if (!ok) return send(res, req, options.onForbidden ?? DEFAULT_FORBIDDEN);
    next();
  };
}

export function requireAnyPermission(
  permissions: PermissionString[],
  options: MiddlewareOptions = {},
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!requireUser(req, res, options)) return;
    const ok = permissions.some((permission) => can(req.user!, permission));
    if (!ok) return send(res, req, options.onForbidden ?? DEFAULT_FORBIDDEN);
    next();
  };
}

export function requireRole(role: AppRole, options: MiddlewareOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!requireUser(req, res, options)) return;
    if (req.user.role !== role) return send(res, req, options.onForbidden ?? DEFAULT_FORBIDDEN);
    next();
  };
}

export function requireAnyRole(allowedRoles: AppRole[], options: MiddlewareOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!requireUser(req, res, options)) return;
    if (!allowedRoles.includes(req.user.role)) {
      return send(res, req, options.onForbidden ?? DEFAULT_FORBIDDEN);
    }
    next();
  };
}

/**
 * Resource-aware example: a team leader may only manage services that
 * belong to their own team, even though the static role grants
 * "service.update" in general. Combine with requirePermission, e.g.:
 *
 *   router.patch(
 *     "/teams/:teamId/services/:id",
 *     requirePermission("service.update"),
 *     requireOwnTeamResource((req) => req.params.teamId),
 *     ...
 *   )
 *
 * OWNER and ADMIN bypass the team check since they operate workspace-wide.
 */
export function requireOwnTeamResource(
  getResourceTeamId: (req: Request) => string | undefined,
  options: MiddlewareOptions = {},
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!requireUser(req, res, options)) return;
    if (req.user.role === "OWNER" || req.user.role === "ADMIN") return next();

    const resourceTeamId = getResourceTeamId(req);
    if (!resourceTeamId || resourceTeamId !== req.user.teamId) {
      return send(res, req, options.onForbidden ?? DEFAULT_FORBIDDEN);
    }
    next();
  };
}

/** Full auth context — one cache hit, zero Prisma / AUTH_URL on warm path. */
type AuthContext = {
  userId: string;
  workspaceId: string;
  role: string;
  teamId?: string;
  locale: string;
};

/** Longer than Studio's 15s sync poll so idle pulls hit memory/Redis instead of AUTH_URL. */
const AUTH_CTX_TTL_MS = 120_000;
const ORG_LOCALE_TTL_MS = 300_000;
const USER_ROLE_TTL_MS = 300_000;

const authCtxCache = createCache({ namespace: "auth:ctx", ttlMs: AUTH_CTX_TTL_MS });
const orgLocaleCache = createCache({ namespace: "auth:locale", ttlMs: ORG_LOCALE_TTL_MS });
const userRoleCache = createCache({ namespace: "auth:role", ttlMs: USER_ROLE_TTL_MS });

export async function invalidateAuthCaches() {
  await Promise.all([authCtxCache.clear(), orgLocaleCache.clear(), userRoleCache.clear()]);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

function readCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(";");
  const prefix = `${name}=`;
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/** Stable token key — avoid hashing the whole Cookie header (other cookies churn). */
function authCacheKey(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token ? `b:${sha256(token)}` : null;
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const sessionToken =
    readCookie(cookieHeader, "hosanna.session_token") ??
    readCookie(cookieHeader, "better-auth.session_token");
  if (sessionToken) return `c:${sha256(sessionToken)}`;

  return `h:${sha256(cookieHeader)}`;
}

function requestHeadersForAuth(req: Request): Headers {
  const headers = new Headers();
  const cookie = req.headers.cookie;
  if (cookie) headers.set("cookie", cookie);
  const origin = req.headers.origin;
  if (typeof origin === "string") headers.set("origin", origin);
  const referer = req.headers.referer;
  if (typeof referer === "string") headers.set("referer", referer);
  const ua = req.headers["user-agent"];
  if (typeof ua === "string") headers.set("user-agent", ua);
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string") headers.set("authorization", authHeader);
  return headers;
}

/** Parse locale out of an org's JSON metadata blob. */
function parseLocaleFromMeta(metadata: unknown): string | null {
  try {
    let meta: any = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    const locale = meta?.settings?.general?.locale ?? meta?.locale;
    if (typeof locale === "string" && locale.length > 0) return locale;
  } catch {
    /* ignore */
  }
  return null;
}

async function getCachedOrgLocale(workspaceId: string): Promise<string> {
  const cached = await orgLocaleCache.get<string>(workspaceId);
  if (cached) return cached;

  const org = await prisma.organization.findUnique({
    where: { id: workspaceId },
    select: { metadata: true },
  });

  const locale = parseLocaleFromMeta(org?.metadata) ?? DEFAULT_LOCALE;
  await orgLocaleCache.set(workspaceId, locale);
  return locale;
}

async function getCachedUserRole(workspaceId: string, userId: string): Promise<string> {
  const key = `${workspaceId}:${userId}`;
  const cached = await userRoleCache.get<string>(key);
  if (cached) return cached;

  const member = await prisma.member.findFirst({
    where: { organizationId: workspaceId, userId },
    select: { role: true },
  });

  const role = member?.role ?? "guest";
  await userRoleCache.set(key, role);
  return role;
}

function roleFromSessionData(sessionData: Exclude<SessionResult, null>): string | null {
  const { user, session } = sessionData;
  const role =
    (session as { role?: string | null }).role ||
    sessionData.member?.role ||
    (user as { role?: string | null }).role;
  return typeof role === "string" && role.length > 0 ? role : null;
}

async function resolveAuthContext(req: Request): Promise<AuthContext> {
  const cacheKey = authCacheKey(req);
  if (cacheKey) {
    const cached = await authCtxCache.get<AuthContext>(cacheKey);
    if (cached?.userId && cached.workspaceId) return cached;
  }

  if (!cacheKey) {
    throw AppError.unauthorized("Invalid or missing authentication session.");
  }

  const sessionData = await getSession({ headers: requestHeadersForAuth(req) });
  if (!sessionData?.session || !sessionData?.user) {
    throw AppError.unauthorized("Invalid or missing authentication session.");
  }

  const { user, session } = sessionData;
  const workspaceId = session.activeOrganizationId;
  if (!workspaceId) {
    throw AppError.forbidden("An active workspace/organization context is required.");
  }

  const teamId = session.activeTeamId || undefined;
  const roleFromSession = roleFromSessionData(sessionData);

  const [resolvedRole, locale] = await Promise.all([
    roleFromSession ? Promise.resolve(roleFromSession) : getCachedUserRole(workspaceId, user.id),
    getCachedOrgLocale(workspaceId),
  ]);

  const ctx: AuthContext = {
    userId: user.id,
    workspaceId,
    role: resolvedRole,
    teamId,
    locale,
  };

  await authCtxCache.set(cacheKey, ctx);
  return ctx;
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const ctx = await resolveAuthContext(req);

    req.locale = ctx.locale;
    req.orgId = ctx.workspaceId;
    req.db = forOrganization(ctx.workspaceId);
    req.user = {
      id: ctx.userId,
      workspaceId: ctx.workspaceId,
      role: ctx.role,
      teamId: ctx.teamId,
    };

    next();
  },
);
