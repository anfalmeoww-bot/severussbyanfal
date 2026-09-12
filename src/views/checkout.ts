import type { Ctx } from "../lib/router";
import { t } from "../lib/i18n";
import { money, escapeHtml } from "../lib/render";
import { renderLayout } from "./layout";
import type { OrderRow } from "../db/repo";
import { getPaymentProvider } from "../payments";
import { config } from "../config";

export function renderCheckoutPage(ctx: Ctx, order: OrderRow): string {
  const T = (key: string) => t(ctx.locale, key);
  const provider = getPaymentProvider();
  const checkoutConfig = provider.getCheckoutConfig({
    id: order.id,
    totalCents: order.total_cents,
    currency: order.currency,
    description: `${config.storeName} order #${order.id.slice(0, 8)}`,
  });

  let paymentUi: string;
  if (checkoutConfig.mode === "mock") {
    paymentUi = `
      <div class="mock-payment-box">
        <p>${T("order_placed")}: <strong>${money(order.total_cents, order.currency, ctx.locale)}</strong></p>
        <button type="button" class="btn btn-primary btn-block" id="mock-pay-btn" data-order-id="${order.id}">
          ${T("simulate_payment")}
        </button>
      </div>`;
  } else {
    // NOTE: verify the current script/CSS URL (version number) at
    // https://docs.moyasar.com/guides/card-payments/basic-integration/
    // before going live — Moyasar occasionally bumps the "mpf" version.
    paymentUi = `
      <div class="mysr-form" id="moyasar-form"></div>
      <link rel="stylesheet" href="https://cdn.moyasar.com/mpf/1.15.0/moyasar.css">
      <script src="https://cdn.moyasar.com/mpf/1.15.0/moyasar.js"></script>
      <script>
        Moyasar.init({
          element: '.mysr-form',
          amount: ${checkoutConfig.amount},
          currency: ${JSON.stringify(checkoutConfig.currency)},
          description: ${JSON.stringify(`${config.storeName} order #${order.id.slice(0, 8)}`)},
          publishable_api_key: ${JSON.stringify(checkoutConfig.publishableKey || "")},
          callback_url: ${JSON.stringify(checkoutConfig.callbackUrl)},
          supported_networks: ['visa', 'mastercard', 'mada'],
          methods: ['creditcard', 'applepay'],
          metadata: { order_id: ${JSON.stringify(order.id)} }
        });
      </script>`;
  }

  const body = `
  <div class="checkout-page">
    <h1>${T("pay_now")}</h1>
    <p class="checkout-total">${T("total")}: <strong>${money(order.total_cents, order.currency, ctx.locale)}</strong></p>
    ${paymentUi}
  </div>`;

  return renderLayout({
    ctx,
    title: T("pay_now"),
    body,
    showSidebar: false,
    extraScripts: checkoutConfig.mode === "mock" ? `<script src="/js/checkout.js"></script>` : "",
  });
}
