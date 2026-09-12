import type { Router } from "../lib/router";
import { HttpError } from "../lib/http";
import { normalizePhone, normalizeOtpCode } from "../lib/validate";
import { requestOtp, verifyOtp } from "../lib/otp";
import { getSmsProvider } from "../sms";
import { getUserByPhone, createUser } from "../db/repo";
import { createSession, destroySessionByToken, isAdminPhone, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from "../lib/auth";
import { serializeCookie, clearCookie } from "../lib/http";
import { renderLoginPage } from "../views/auth";
import { requireCsrf } from "../middleware/guards";

export function registerAuthRoutes(router: Router) {
  router.get("/login", (ctx) => {
    if (ctx.session) {
      ctx.redirect("/");
      return;
    }
    ctx.html(200, renderLoginPage(ctx));
  });

  router.post("/api/auth/request-otp", async (ctx) => {
    const body = await ctx.jsonBody<{ phone?: string }>();
    const phone = normalizePhone(body.phone);
    const { code } = requestOtp(phone, "login");
    await getSmsProvider().sendOtp(phone, code);
    ctx.json(200, { ok: true, phone });
  });

  router.post("/api/auth/verify-otp", async (ctx) => {
    const body = await ctx.jsonBody<{ phone?: string; code?: string }>();
    const phone = normalizePhone(body.phone);
    const code = normalizeOtpCode(body.code);
    verifyOtp(phone, "login", code);

    let user = getUserByPhone(phone);
    let isNewUser = false;
    if (!user) {
      user = createUser(phone, isAdminPhone(phone) ? "admin" : "customer");
      isNewUser = true;
    }

    const { cookieValue } = createSession(user.id, ctx.req.headers["user-agent"]);
    ctx.setCookie(
      serializeCookie(SESSION_COOKIE_NAME, cookieValue, { maxAgeSeconds: SESSION_COOKIE_MAX_AGE })
    );
    ctx.json(200, { ok: true, isNewUser, isAdmin: user.role === "admin" });
  });

  router.post("/api/auth/logout", (ctx) => {
    requireCsrf(ctx);
    const token = ctx.cookies[SESSION_COOKIE_NAME];
    if (token) destroySessionByToken(token);
    ctx.setCookie(clearCookie(SESSION_COOKIE_NAME));
    ctx.json(200, { ok: true });
  });

  router.get("/api/auth/me", (ctx) => {
    if (!ctx.session) {
      ctx.json(200, { user: null });
      return;
    }
    const { user } = ctx.session;
    ctx.json(200, {
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role, theme: user.theme, locale: user.locale },
    });
  });

  router.get("/api/locale/:locale", (ctx) => {
    const locale = ctx.params.locale === "en" ? "en" : "ar";
    ctx.setCookie(serializeCookie("locale", locale, { maxAgeSeconds: 60 * 60 * 24 * 365, httpOnly: false }));
    const redirectTo = ctx.query.get("redirect") || "/";
    ctx.redirect(redirectTo.startsWith("/") ? redirectTo : "/");
  });
}
