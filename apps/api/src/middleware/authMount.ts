import { toNodeHandler } from "better-auth/node";
import { withOauthNavigationRedirect } from "@hosanna/auth/server";
import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { auth } from "../lib/auth.js";
import { evaluateAuthMount } from "../lib/flags.js";

const localAuthHandler = toNodeHandler(withOauthNavigationRedirect(auth.handler));

/**
 * Per-request `auth-mount` flag dispatch (local | delegate | off).
 * Evaluated inside the handler so Vercel OIDC is available.
 */
export const authMountDispatch: RequestHandler = async (req, res, next) => {
  try {
    const mode = await evaluateAuthMount();

    if (mode === "off") {
      res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Auth HTTP is disabled on this host (auth-mount=off).",
        },
      });
      return;
    }

    if (mode === "delegate") {
      const target = (env.authUrl ?? "").replace(/\/+$/, "");
      if (!target) {
        res.status(503).json({
          error: {
            code: "MISCONFIGURED",
            message: "auth-mount=delegate requires AUTH_URL.",
          },
        });
        return;
      }
      res.redirect(308, `${target}${req.originalUrl}`);
      return;
    }

    // local — Better Auth on this process
    return localAuthHandler(req, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Authorization-server discovery root: local mode redirects into Better Auth's
 * nested well-known path; otherwise same as {@link authMountDispatch}.
 */
export const authMountAuthorizationServerRoot: RequestHandler = async (req, res, next) => {
  try {
    const mode = await evaluateAuthMount();
    if (mode === "local") {
      res.redirect(302, "/.well-known/oauth-authorization-server/api/auth");
      return;
    }
    return authMountDispatch(req, res, next);
  } catch (err) {
    next(err);
  }
};
