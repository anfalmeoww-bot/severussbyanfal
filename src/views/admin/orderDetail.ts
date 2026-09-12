import type { Ctx } from "../../lib/router";
import { t } from "../../lib/i18n";
import { escapeHtml, money, formatDate } from "../../lib/render";
import { renderAdminLayout } from "./layout";
import type { OrderRow, OrderItemRow } from "../../db/repo";

export function renderAdminOrderDetailPage(ctx: Ctx, order: OrderRow, items: OrderItemRow[]): string {
  const T = (key: string) => t(ctx.locale, key);
  const locale = ctx.locale;

  const body = `
  <div class="order-detail-admin">
    <p><strong>${T("status")}:</strong> <span class="status-pill status-${order.status}">${T("status_" + order.status)}</span></p>
    <p><strong>${T("date")}:</strong> ${formatDate(order.created_at, locale)}</p>
    <h3>${T("shipping_details")}</h3>
    <p>${escapeHtml(order.shipping_name)}<br>${escapeHtml(order.shipping_phone)}<br>${escapeHtml(order.shipping_city)}<br>${escapeHtml(order.shipping_address)}</p>
    <h3>${T("order_number")}</h3>
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
    ${order.payment_ref ? `<p class="form-hint">${T("status")}: ${escapeHtml(order.payment_provider ?? "")} / ${escapeHtml(order.payment_ref)}</p>` : ""}
  </div>`;

  return renderAdminLayout({ ctx, title: `${T("order_number")} #${order.id.slice(0, 8).toUpperCase()}`, active: "orders", body });
}
