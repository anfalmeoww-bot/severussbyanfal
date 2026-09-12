export interface OrderForPayment {
  id: string;
  totalCents: number;
  currency: string;
  description: string;
}

export type PaymentStatus = "pending" | "paid" | "failed";

export interface PaymentCheckoutConfig {
  /** Which client-side checkout template to render. */
  mode: "mock" | "moyasar";
  amount: number;
  currency: string;
  orderId: string;
  callbackUrl: string;
  publishableKey?: string;
  storeName: string;
}

export interface PaymentProvider {
  name: string;
  getCheckoutConfig(order: OrderForPayment): PaymentCheckoutConfig;
  /** Authoritative status check — always re-verify with the gateway, never trust client/webhook input alone. */
  verifyPaymentStatus(paymentRef: string): Promise<{ status: PaymentStatus; amount: number; currency: string }>;
  /** Validates an incoming webhook and extracts the payment reference to re-verify. Returns null if invalid. */
  parseWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): { paymentRef: string } | null;
}
