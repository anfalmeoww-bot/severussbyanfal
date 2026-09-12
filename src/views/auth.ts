import type { Ctx } from "../lib/router";
import { t } from "../lib/i18n";
import { deerLogoSvg } from "./logo";

export function renderLoginPage(ctx: Ctx): string {
  const T = (key: string) => t(ctx.locale, key);
  const dir = ctx.locale === "ar" ? "rtl" : "ltr";

  return `<!doctype html>
<html lang="${ctx.locale}" dir="${dir}" data-theme="${ctx.theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${T("login")} · ${T("app_name")}</title>
<link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
<link rel="stylesheet" href="/css/styles.css">
</head>
<body data-locale="${ctx.locale}" class="auth-body">
<div class="lang-switch auth-lang-switch">
  <a href="/api/locale/ar?redirect=/login" class="lang-opt ${ctx.locale === "ar" ? "active" : ""}">AR</a>
  <span class="lang-sep">/</span>
  <a href="/api/locale/en?redirect=/login" class="lang-opt ${ctx.locale === "en" ? "active" : ""}">EN</a>
</div>
<main class="auth-shell">
  <div class="auth-card">
    <div class="auth-brand">
      <span class="brand-mark brand-mark-lg">${deerLogoSvg({ size: 56, color: "var(--brand-primary)" })}</span>
      <h1>${T("app_name")}</h1>
      <p class="auth-subtitle">${T("welcome_back")}</p>
    </div>

    <form id="phone-step" class="auth-form">
      <label for="phone-input">${T("enter_phone")}</label>
      <input id="phone-input" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${T("phone_placeholder")}" required>
      <p class="field-error" id="phone-error" hidden></p>
      <button type="submit" class="btn btn-primary btn-block">${T("send_code")}</button>
    </form>

    <form id="code-step" class="auth-form" hidden>
      <p class="code-sent-note">${T("code_sent_to")} <strong id="code-phone-display"></strong></p>
      <label for="code-input">${T("enter_code")}</label>
      <input id="code-input" name="code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" required>
      <p class="field-error" id="code-error" hidden></p>
      <button type="submit" class="btn btn-primary btn-block">${T("verify")}</button>
      <div class="auth-links">
        <button type="button" id="resend-code" class="link-btn">${T("resend_code")}</button>
        <button type="button" id="change-number" class="link-btn">${T("change_number")}</button>
      </div>
    </form>
  </div>
</main>
<script>
window.__APP__ = ${JSON.stringify({ locale: ctx.locale, theme: ctx.theme, csrfToken: "", loggedIn: false })};
</script>
<script src="/js/app.js"></script>
<script src="/js/auth.js"></script>
</body>
</html>`;
}
