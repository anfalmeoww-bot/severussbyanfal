import { createHash, timingSafeEqual } from "node:crypto";
import { get, run, now } from "../db";
import { newId, randomToken } from "./ids";
import { config } from "../config";

export interface UserRow {
  id: string;
  phone: string;
  name: string | null;
  role: "customer" | "admin";
  theme: "light-blue" | "dark-blue";
  locale: "ar" | "en";
  created_at: number;
  updated_at: number;
}

export interface SessionContext {
  sessionId: string;
  user: UserRow;
  csrfSecret: string;
}

const SESSION_COOKIE = "session_token";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).update(config.appSecret).digest("hex");
}

export function isAdminPhone(phone: string): boolean {
  return config.adminPhoneNumbers.includes(phone);
}

/** Creates a brand-new session for a user and returns the cookie value to set. */
export function createSession(userId: string, userAgent: string | undefined): { cookieValue: string; csrfSecret: string } {
  const token = randomToken(32);
  const csrfSecret = randomToken(24);
  const id = newId();
  const expiresAt = now() + SESSION_TTL_SECONDS * 1000;
  run(
    `INSERT INTO sessions (id, user_id, token_hash, csrf_secret, user_agent, expires_at, created_at)
     VALUES (@id, @userId, @tokenHash, @csrfSecret, @userAgent, @expiresAt, @createdAt)`,
    {
      id,
      userId,
      tokenHash: hashToken(token),
      csrfSecret,
      userAgent: userAgent ?? null,
      expiresAt,
      createdAt: now(),
    }
  );
  return { cookieValue: token, csrfSecret };
}

export function destroySessionByToken(token: string) {
  run(`DELETE FROM sessions WHERE token_hash = @tokenHash`, { tokenHash: hashToken(token) });
}

export async function getSessionFromCookies(cookies: Record<string, string>): Promise<SessionContext | null> {
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = get<{
    id: string;
    user_id: string;
    csrf_secret: string;
    expires_at: number;
  }>(`SELECT id, user_id, csrf_secret, expires_at FROM sessions WHERE token_hash = @tokenHash`, {
    tokenHash,
  });
  if (!row) return null;
  if (row.expires_at < now()) {
    run(`DELETE FROM sessions WHERE id = @id`, { id: row.id });
    return null;
  }
  const user = get<UserRow>(`SELECT * FROM users WHERE id = @id`, { id: row.user_id });
  if (!user) return null;

  // Defense in depth: admin role only counts while the phone is still on the
  // allowlist. If the owner removes a number from ADMIN_PHONE_NUMBERS, that
  // account loses admin rights on its very next request.
  const effectiveRole: "customer" | "admin" = isAdminPhone(user.phone) ? "admin" : "customer";
  if (effectiveRole !== user.role) {
    run(`UPDATE users SET role = @role, updated_at = @now WHERE id = @id`, {
      role: effectiveRole,
      now: now(),
      id: user.id,
    });
    user.role = effectiveRole;
  }

  return { sessionId: row.id, user, csrfSecret: row.csrf_secret };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;

/** Constant-time CSRF token check (double-submit pattern). */
export function verifyCsrf(session: SessionContext | null, providedToken: string | undefined | null): boolean {
  if (!session || !providedToken) return false;
  const expected = createHash("sha256").update(session.csrfSecret).update(session.sessionId).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(providedToken, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function csrfTokenFor(session: SessionContext): string {
  return createHash("sha256").update(session.csrfSecret).update(session.sessionId).digest("hex");
}
