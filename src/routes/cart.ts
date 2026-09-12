import type { Router } from "../lib/router";
import { HttpError } from "../lib/http";
import { requireAuth, requireCsrf } from "../middleware/guards";
import { requirePositiveInt } from "../lib/validate";
import { getCartItems, upsertCartItem, removeCartItem, getProductById } from "../db/repo";
import { renderCartPage } from "../views/cart";

export function registerCartRoutes(router: Router) {
  router.get("/cart", (ctx) => {
    requireAuth(ctx);
    ctx.html(200, renderCartPage(ctx));
  });

  router.get("/api/cart", (ctx) => {
    const session = requireAuth(ctx);
    const items = getCartItems(session.user.id);
    ctx.json(200, { items });
  });

  router.post("/api/cart", async (ctx) => {
    const session = requireAuth(ctx);
    requireCsrf(ctx);
    const body = await ctx.jsonBody<{ productId?: string; quantity?: number }>();
    if (!body.productId) throw new HttpError(400, "productId is required.");
    const product = getProductById(body.productId);
    if (!product || !product.is_active) throw new HttpError(404, "Product not found.");
    const quantity = requirePositiveInt(body.quantity ?? 1, "Quantity");
    if (quantity > product.stock) {
      throw new HttpError(409, `Only ${product.stock} left in stock.`);
    }
    upsertCartItem(session.user.id, product.id, quantity);
    const items = getCartItems(session.user.id);
    ctx.json(200, { ok: true, items, cartCount: items.reduce((s, i) => s + i.quantity, 0) });
  });

  router.delete("/api/cart/:productId", (ctx) => {
    const session = requireAuth(ctx);
    requireCsrf(ctx);
    removeCartItem(session.user.id, ctx.params.productId);
    const items = getCartItems(session.user.id);
    ctx.json(200, { ok: true, items, cartCount: items.reduce((s, i) => s + i.quantity, 0) });
  });
}
