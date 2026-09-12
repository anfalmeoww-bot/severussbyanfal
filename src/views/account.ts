import type { Ctx } from "../lib/router";
import { t } from "../lib/i18n";
import { escapeHtml } from "../lib/render";
import { renderLayout } from "./layout";

export function renderAccountPage(ctx: Ctx): string {
  const T = (key: string) => t(ctx.locale, key);
  const user = ctx.session!.user;

  const body = `
  <div class="page-heading"><h1>${T("my_account")}</h1></div>
  <div class="account-page">
    <section class="account-section">
      <h2>${T("account_name")}</h2>
      <form id="name-form" class="inline-form">
        <input name="name" value="${escapeHtml(user.name || "")}" maxlength="80" placeholder="${T("account_name")}">
        <button type="submit" class="btn btn-primary">${T("save")}</button>
      </form>
      <p class="form-note" id="name-note" hidden></p>
    </section>

    <section class="account-section">
      <h2>${T("account_phone")}</h2>
      <p class="current-value">${escapeHtml(user.phone)}</p>
      <button type="button" class="btn btn-ghost" id="show-phone-change">${T("change_phone")}</button>

      <form id="phone-request-form" class="inline-form" hidden>
        <input name="newPhone" type="tel" placeholder="${T("new_phone")}" required>
        <button type="submit" class="btn btn-primary">${T("send_code")}</button>
      </form>
      <form id="phone-confirm-form" class="inline-form" hidden>
        <input name="code" type="text" inputmode="numeric" maxlength="6" placeholder="${T("enter_code")}" required>
        <button type="submit" class="btn btn-primary">${T("verify")}</button>
      </form>
      <p class="form-note" id="phone-note" hidden></p>
    </section>
  </div>`;

  return renderLayout({ ctx, title: T("my_account"), body, showSidebar: false, extraScripts: `<script src="/js/account.js"></script>` });
}
