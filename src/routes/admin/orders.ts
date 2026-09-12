import type { Router } from "../../lib/router";
import { HttpError } from "../../lib/http";
import { requireAdmin } from "../../middleware/guards";
import { listAllOrders, getOrderById, getOrderItems } from "../../db/repo";
import { renderAdminOrdersPage } from "../../views/admin/orders";
import { renderAdminOrderDetailPage } from "../../views/admin/orderDetail";

export function registerAdminOrderRoutes(router: Router) {
  router.get("/admin/orders", (ctx) => {
    requireAdmin(ctx);
    ctx.html(200, renderAdminOrdersPage(ctx));
  });

  router.get("/admin/orders/:id", (ctx) => {
    requireAdmin(ctx);
    const order = getOrderById(ctx.params.id);
    if (!order) throw new HttpError(404, "Order not found.");
    ctx.html(200, renderAdminOrderDetailPage(ctx, order, getOrderItems(order.id)));
  });

  router.get("/api/admin/orders", (ctx) => {
    requireAdmin(ctx);
    ctx.json(200, { orders: listAllOrders() });
  });
}
