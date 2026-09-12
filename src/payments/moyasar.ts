import { timingSafeEqual } from "node:crypto";
import type { PaymentProvider, OrderForPayment, PaymentStatus } from "./provider";
import { config } from "../config";

const API_BASE = "https://api.moyasar.com/v1";

function authHeader(): string {
  // Moyasar uses HTTP Basic auth with the secret key as the username and an
  // empty password.
  const token = Buffer.from(`${config.moyasar.secretKey}:`).toString("base64");
  return `Basic ${token}`;
}

function mapStatus(moyasarStatus: string): PaymentStatus {
  switch (moyasarStatus) {
    case "paid":
    case "captured":
    case "authorized":
    case "verified":
      return "paid";
    case "failed":
    case "voided":
      return "failed";
    default:
      return "pending";
  }
}

export const moyasarPaymentProvider: PaymentProvider = {
  name: "moyasar",

  getCheckoutConfig(order: OrderForPayment) {
    return {
      mode: "moyasar",
      amount: order.totalCents,
      currency: order.currency,
      orderId: order.id,
      callbackUrl: `${config.baseUrl}/orders/${order.id}/complete`,
      publishableKey: config.moyasar.publishableKey,
      storeName: config.storeName,
    };
  },

  async verifyPaymentStatus(paymentRef: string) {
    if (!config.moyasar.secretKey) {
      throw new Error("MOYASAR_SECRET_KEY is not configured.");
    }
    const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentRef)}`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) {
      throw new Error(`Moyasar payment lookup failed (${res.status}).`);
    }
    const data = (await res.json()) as { status: string; amount: number; currency: string };
    return { status: mapStatus(data.status), amount: data.amount, currency: data.currency };
  },

  parseWebhook(rawBody: Buffer, _headers) {
    if (!config.moyasar.webhookSecret) {
      // No webhook secret configured — refuse to trust any webhook. Order
      // status will still be confirmed on the customer's redirect back to
      // /orders/:id/complete, so checkout keeps working, but you should set
      // MOYASAR_WEBHOOK_SECRET so payments that complete after the browser
      // closes are still picked up.
      return null;
    }
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return null;
    }
    const providedSecret = typeof payload?.secret_token === "string" ? payload.secret_token : "";
    if (!timingSafeStringEqual(providedSecret, config.moyasar.webhookSecret)) {
      return null;
    }
    const paymentRef = payload?.data?.id;
    if (typeof paymentRef !== "string") return null;
    return { paymentRef };
  },
};

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
