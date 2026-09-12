import type { Router } from "../lib/router";
import { HttpError, serializeCookie } from "../lib/http";
import { requireAuth, requireCsrf } from "../middleware/guards";
import { requireString, normalizePhone, normalizeOtpCode } from "../lib/validate";
import { updateUserName, updateUserPhone, updateUserTheme, getUserByPhone } from "../db/repo";
import { requestOtp, verifyOtp } from "../lib/otp";
import { getSmsProvider } from "../sms";
import { renderAccountPage } from "../views/account";

export function registerAccountRoutes(router: Router) {
  router.get("/account", (ctx) => {
    requireAuth(ctx);
    ctx.html(200, renderAccountPage(ctx));
  });

  router.post("/api/account/name", async (ctx) => {
    const session = requireAuth(ctx);
    requireCsrf(ctx);
    const body = await ctx.jsonBody<{ name?: string }>();
    const name = requireString(body.name, "Name", { min: 1, max: 80 });
    updateUserName(session.user.id, name);
    ctx.json(200, { ok: true, name });
  });

  router.post("/api/account/theme", async (ctx) => {
    const session = requireAuth(ctx);
    requireCsrf(ctx);
    const body = await ctx.jsonBody<{ theme?: string }>();
    const theme = body.theme === "dark-blue" ? "dark-blue" : body.theme === "light-blue" ? "light-blue" : null;
    if (!theme) throw new HttpError(400, "Invalid theme.");
    updateUserTheme(session.user.id, theme);
    ctx.setCookie(serializeCookie("theme", theme, { maxAgeSeconds: 60 * 60 * 24 * 365, httpOnly: false }));
    ctx.json(200, { ok: true, theme });
  });

  // Step 1: request a code be sent to the NEW phone number.
  router.post("/api/account/phone/request", async (ctx) => {
    const session = requireAuth(ctx);
    requireCsrf(ctx);
    const body = await ctx.jsonBody<{ newPhone?: string }>();
    const newPhone = normalizePhone(body.newPhone);
    if (newPhone === session.user.phone) {
      throw new HttpError(400, "This is already your current phone number.");
    }
    const existing = getUserByPhone(newPhone);
    if (existing && existing.id !== session.user.id) {
      throw new HttpError(409, "This phone number is already in use by another account.");
    }
    const { code } = requestOtp(newPhone, "change_phone", { userId: session.user.id });
    await getSmsProvider().sendOtp(newPhone, code);
    ctx.json(200, { ok: true, newPhone });
  });

  // Step 2: confirm the code sent to the new number.
  router.post("/api/account/phone/confirm", async (ctx) => {
    const session = requireAuth(ctx);
    requireCsrf(ctx);
    const body = await ctx.jsonBody<{ newPhone?: string; code?: string }>();
    const newPhone = normalizePhone(body.newPhone);
    const code = normalizeOtpCode(body.code);
    const row = verifyOtp(newPhone, "change_phone", code);
    if (row.user_id !== session.user.id) {
      throw new HttpError(403, "This verification code was not issued for your account.");
    }
    updateUserPhone(session.user.id, newPhone);
    ctx.json(200, { ok: true, phone: newPhone });
  });
}
