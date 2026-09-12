import type { Ctx } from "../../lib/router";
import { t } from "../../lib/i18n";
import { renderAdminLayout } from "./layout";

export function renderAdminProductsPage(ctx: Ctx): string {
  const T = (key: string) => t(ctx.locale, key);
  const body = `
  <div class="admin-toolbar">
    <a href="/admin/products/new" class="btn btn-primary">${T("add_product")}</a>
  </div>
  <div id="products-list" class="admin-table-wrap">
    <p class="loading-text">…</p>
  </div>`;
  return renderAdminLayout({
    ctx,
    title: T("admin_products"),
    active: "products",
    body,
    extraScripts: `<script src="/js/admin-products.js"></script>`,
  });
}
