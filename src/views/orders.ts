import type { Ctx } from "../lib/router";
import { t } from "../lib/i18n";
import { renderLayout } from "./layout";

export function renderOrdersPage(ctx: Ctx): string {
  const T = (key: string) => t(ctx.locale, key);
  const body = `
  <div class="page-heading"><h1>${T("order_history")}</h1></div>
  <div id="orders-list" class="orders-list">
    <p class="loading-text">…</p>
  </div>`;
  return renderLayout({ ctx, title: T("order_history"), body, showSidebar: true, extraScripts: `<script src="/js/orders.js"></script>` });
}
