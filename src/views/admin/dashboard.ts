import type { Ctx } from "../../lib/router";
import { t } from "../../lib/i18n";
import { money } from "../../lib/render";
import { renderAdminLayout } from "./layout";
import { config } from "../../config";

export interface AdminStats {
  productCount: number;
  categoryCount: number;
  orderCount: number;
  paidOrderCount: number;
  revenueCents: number;
  lowStockCount: number;
}

export function renderAdminDashboardPage(ctx: Ctx, stats: AdminStats): string {
  const T = (key: string) => t(ctx.locale, key);
  const body = `
  <div class="stat-grid">
    <div class="stat-card">
      <span class="stat-value">${money(stats.revenueCents, config.defaultCurrency, ctx.locale)}</span>
      <span class="stat-label">${T("status_paid")} · ${T("admin_orders")}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${stats.orderCount}</span>
      <span class="stat-label">${T("admin_orders")}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${stats.productCount}</span>
      <span class="stat-label">${T("admin_products")}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">${stats.categoryCount}</span>
      <span class="stat-label">${T("admin_categories")}</span>
    </div>
  </div>
  <div class="admin-quick-actions">
    <a href="/admin/products/new" class="btn btn-primary">${T("add_product")}</a>
    <a href="/admin/categories" class="btn btn-ghost">${T("add_category")}</a>
  </div>
  ${
    stats.lowStockCount > 0
      ? `<p class="admin-alert">${stats.lowStockCount} ${T("stock").toLowerCase()} ⚠️</p>`
      : ""
  }
  `;
  return renderAdminLayout({ ctx, title: T("admin_dashboard"), active: "dashboard", body });
}
