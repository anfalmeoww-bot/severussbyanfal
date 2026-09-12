import type { Ctx } from "../../lib/router";
import { t } from "../../lib/i18n";
import { renderAdminLayout } from "./layout";

export function renderAdminOrdersPage(ctx: Ctx): string {
  const T = (key: string) => t(ctx.locale, key);
  const body = `
  <div id="admin-orders-list" class="admin-table-wrap">
    <p class="loading-text">…</p>
  </div>`;
  return renderAdminLayout({
    ctx,
    title: T("admin_orders"),
    active: "orders",
    body,
    extraScripts: `<script src="/js/admin-orders.js"></script>`,
  });
}
