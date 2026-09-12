import { config } from "../config";
import type { PaymentProvider } from "./provider";
import { mockPaymentProvider } from "./mock";
import { moyasarPaymentProvider } from "./moyasar";

export function getPaymentProvider(): PaymentProvider {
  switch (config.paymentProvider) {
    case "moyasar":
      return moyasarPaymentProvider;
    case "mock":
    default:
      return mockPaymentProvider;
  }
}

export * from "./provider";
