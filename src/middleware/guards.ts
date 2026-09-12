import type { Ctx } from "../lib/router";
import { HttpError } from "../lib/http";
import { verifyCsrf } from "../lib/auth";

export function requireAuth(ctx: Ctx) {
  if (!ctx.session) {
    throw new HttpError(401, "You must be logged in to do that.");
  }
  return ctx.session;
}

export function requireAdmin(ctx: Ctx) {
  const session = requireAuth(ctx);
  if (session.user.role !== "admin") {
    throw new HttpError(403, "Admin access only.");
  }
  return session;
}

/** Call at the top of every state-changing JSON route (POST/PUT/DELETE). */
export function requireCsrf(ctx: Ctx) {
  const header = ctx.req.headers["x-csrf-token"];
  const token = Array.isArray(header) ? header[0] : header;
  if (!verifyCsrf(ctx.session, token)) {
    throw new HttpError(403, "Invalid or missing CSRF token. Please refresh the page and try again.");
  }
}
