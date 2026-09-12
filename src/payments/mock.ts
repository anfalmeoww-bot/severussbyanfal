import type { PaymentProvider, OrderForPayment } from "./provider";
import { config } from "../config";

/**
 * Development-only payment provider. Renders a "Simulate successful
 * payment" button instead of talking to a real payment gateway — no money
 * ever moves. This exists purely so you can click through the whole
 * purchase flow locally before your Moyasar account is ready.
 *
 * NEVER enable PAYMENT_PROVIDER=mock in production.
 */
export const mockPaymentProvider: PaymentProvider = {
  name: "mock",

  getCheckoutConfig(order: OrderForPayment) {
    return {
      mode: "mock",
      amount: order.totalCents,
      currency: order.currency,
      orderId: order.id,
      callbackUrl: `${config.baseUrl}/orders/${order.id}/complete`,
      storeName: config.storeName,
    };
  },

  async verifyPaymentStatus(paymentRef: string) {
    // In mock mode the "payment ref" is just the order id, and the order
    // route marks it paid directly — this function isn't used in mock mode.
    return { status: "paid" as const, amount: 0, currency: config.defaultCurrency };
  },

  parseWebhook() {
    return null;
  },
};
