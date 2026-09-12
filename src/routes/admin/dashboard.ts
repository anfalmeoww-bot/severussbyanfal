import type { Router } from "../../lib/router";
import { requireAdmin } from "../../middleware/guards";
import { listProducts, listCategories, listAllOrders } from "../../db/repo";
import { renderAdminDashboardPage } from "../../views/admin/dashboard";

export function registerAdminDashboardRoutes(router: Router) {
  router.get("/admin", (ctx) => {
    requireAdmin(ctx);
    const products = listProducts({});
    const categories = listCategories();
    const orders = listAllOrders();
    const stats = {
      productCount: products.length,
      categoryCount: categories.length,
      orderCount: orders.length,
      paidOrderCount: orders.filter((o) => o.status === "paid").length,
      revenueCents: orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total_cents, 0),
      lowStockCount: products.filter((p) => p.stock <= 3).length,
    };
    ctx.html(200, renderAdminDashboardPage(ctx, stats));
  });
}
