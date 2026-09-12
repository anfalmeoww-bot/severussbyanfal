import type { Router } from "../lib/router";
import { HttpError, readRawBody } from "../lib/http";
import { requireAuth, requireCsrf } from "../middleware/guards";
import { requireString } from "../lib/validate";
import { normalizePhone } from "../lib/validate";
import {
  createOrderFromCart,
  getOrderById,
  getOrderItems,
  listOrdersForUser,
  markOrderPaid,
  markOrderFailed,
} from "../db/repo";
import { getPaymentProvider } from "../payments";
import { config } from "../config";
import { renderCheckoutPage } from "../views/checkout";
import { renderOrderCompletePage } from "../views/orderComplete";
import { renderOrdersPage } from "../views/orders";

export function registerOrderRoutes(router: Router) {
  router.post("/api/checkout", async (ctx) => {
    const session = requireAuth(ctx);
    requireCsrf(ctx);
    const body = await ctx.jsonBody<{ name?: string; phone?: string; city?: string; address?: string }>();
    const shipping = {
      name: requireString(body.name, "Full name", { min: 1, max: 120 }),
      phone: normalizePhone(body.phone),
      city: requireString(body.city, "City", { min: 1, max: 80 }),
      address: requireString(body.address, "Address", { min: 1, max: 300 }),
    };
    const order = createOrderFromCart(session.user.id, shipping, config.defaultCurrency);
    ctx.json(200, { ok: true, orderId: order.id });
  });

  router.get("/checkout/:orderId", (ctx) => {
    const session = requireAuth(ctx);
    const order = getOrderById(ctx.params.orderId);
    if (!order || order.user_id !== session.user.id) throw new HttpError(404, "Order not found.");
    ctx.html(200, renderCheckoutPage(ctx, order));
  });

  // Dev-only helper: instantly mark an order paid without a real gateway.
  router.post("/api/orders/:id/mock-pay", (ctx) => {
    const session = requireAuth(ctx);
    requireCsrf(ctx);
    if (config.paymentProvider !== "mock") {
      throw new HttpError(403, "Mock payments are disabled. PAYMENT_PROVIDER is not set to 'mock'.");
    }
    const order = getOrderById(ctx.params.id);
    if (!order || order.user_id !== session.user.id) throw new HttpError(404, "Order not found.");
    markOrderPaid(order.id, "mock", `mock_${order.id}`);
    ctx.json(200, { ok: true });
  });

  router.get("/orders/:id/complete", async (ctx) => {
    const session = requireAuth(ctx);
    const order = getOrderById(ctx.params.id);
    if (!order || order.user_id !== session.user.id) throw new HttpError(404, "Order not found.");

    // Re-verify with the gateway server-side before trusting the redirect —
    // never mark an order paid based on query-string params alone.
    if (order.status === "pending") {
      const provider = getPaymentProvider();
      const paymentRef = ctx.query.get("id");
      if (provider.name !== "mock" && paymentRef) {
        try {
          const result = await provider.verifyPaymentStatus(paymentRef);
          if (result.status === "paid" && result.amount === order.total_cents && result.currency === order.currency) {
            markOrderPaid(order.id, provider.name, paymentRef);
          } else if (result.status === "failed") {
            markOrderFailed(order.id, provider.name, paymentRef);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Payment verification failed:", err);
        }
      }
    }

    const refreshed = getOrderById(order.id)!;
    const items = getOrderItems(refreshed.id);
    ctx.html(200, renderOrderCompletePage(ctx, refreshed, items));
  });

  // Async confirmation in case the customer closes the browser before the
  // redirect back to /orders/:id/complete happens.
  router.post("/webhooks/moyasar", async (ctx) => {
    const raw = await readRawBody(ctx.req);
    const provider = getPaymentProvider();
    const parsed = provider.parseWebhook(raw, ctx.req.headers as Record<string, string | string[] | undefined>);
    if (!parsed) {
      ctx.res.writeHead(200).end("ignored");
      return;
    }
    try {
      const result = await provider.verifyPaymentStatus(parsed.paymentRef);
      // Find the order this payment belongs to. We stored payment_ref only
      // after confirming, so on the very first confirmation we must look up
      // by matching the callback that created it — simplest robust approach
      // here is to also accept the order id embedded by Moyasar in metadata
      // if you choose to send it; as a fallback we no-op if we can't map it.
      const orderId = (JSON.parse(raw.toString("utf8"))?.data?.metadata?.order_id as string | undefined) ?? null;
      if (orderId) {
        if (result.status === "paid") markOrderPaid(orderId, provider.name, parsed.paymentRef);
        else if (result.status === "failed") markOrderFailed(orderId, provider.name, parsed.paymentRef);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Webhook processing failed:", err);
    }
    ctx.res.writeHead(200).end("ok");
  });

  router.get("/orders", (ctx) => {
    requireAuth(ctx);
    ctx.html(200, renderOrdersPage(ctx));
  });

  router.get("/api/orders", (ctx) => {
    const session = requireAuth(ctx);
    const orders = listOrdersForUser(session.user.id);
    ctx.json(200, { orders });
  });
}
