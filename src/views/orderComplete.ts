import type { Ctx } from "../lib/router";
import { t } from "../lib/i18n";
import { escapeHtml, money, formatDate } from "../lib/render";
import { renderLayout } from "./layout";
import type { OrderRow, OrderItemRow } from "../db/repo";

export function renderOrderCompletePage(ctx: Ctx, order: OrderRow, items: OrderItemRow[]): string {
  const T = (key: string) => t(ctx.locale, key);
  const locale = ctx.locale;

  const statusMessage =
    order.status === "paid"
      ? `<div class="status-banner success">${T("order_paid")}</div>`
      : order.status === "failed"
      ? `<div class="status-banner error">${T("order_failed")}</div>`
      : `<div class="status-banner pending">${T("order_pending")}</div>`;

  const body = `
  <div class="order-complete-page">
    ${statusMessage}
    <h1>${T("order_number")} #${order.id.slice(0, 8).toUpperCase()}</h1>
    <p class="order-meta">${formatDate(order.created_at, locale)}</p>
    <div class="order-items-list">
      ${items
        .map(
          (item) => `
        <div class="order-line">
          <span>${escapeHtml(locale === "ar" ? item.product_name_ar : item.product_name_en)} × ${item.quantity}</span>
          <span>${money(item.unit_price_cents * item.quantity, order.currency, locale)}</span>
        </div>`
        )
        .join("")}
    </div>
    <div class="order-total-row">
      <span>${T("total")}</span>
      <span>${money(order.total_cents, order.currency, locale)}</span>
    </div>
    <a href="/" class="btn btn-primary">${T("back_to_store")}</a>
  </div>`;

  return renderLayout({ ctx, title: T("order_number"), body, showSidebar: false });
}
