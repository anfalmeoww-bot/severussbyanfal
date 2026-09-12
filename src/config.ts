import path from "node:path";
import fs from "node:fs";

function loadDotEnv(file: string) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// Load .env (production secrets) without any external dependency.
loadDotEnv(path.resolve(process.cwd(), ".env"));

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",
  port: parseInt(process.env.PORT || "3000", 10),
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  appSecret: required("APP_SECRET", "dev-insecure-secret-change-me"),

  adminPhoneNumbers: (process.env.ADMIN_PHONE_NUMBERS || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean),

  databaseFile: process.env.DATABASE_FILE || "./data/store.db",

  smsProvider: (process.env.SMS_PROVIDER || "console") as "console" | "unifonic",
  unifonic: {
    appSid: process.env.UNIFONIC_APP_SID || "",
    senderId: process.env.UNIFONIC_SENDER_ID || "SeverusByAnfal",
  },

  paymentProvider: (process.env.PAYMENT_PROVIDER || "mock") as "mock" | "moyasar",
  moyasar: {
    secretKey: process.env.MOYASAR_SECRET_KEY || "",
    publishableKey: process.env.MOYASAR_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.MOYASAR_WEBHOOK_SECRET || "",
  },
  defaultCurrency: process.env.DEFAULT_CURRENCY || "SAR",

  applePayDomainAssociation: process.env.APPLE_PAY_DOMAIN_ASSOCIATION || "",

  storeName: "SeverusByAnfal",
};

if (config.isProduction && config.appSecret === "dev-insecure-secret-change-me") {
  // eslint-disable-next-line no-console
  console.error(
    "FATAL: APP_SECRET is not set. Refusing to start in production with the default secret."
  );
  process.exit(1);
}

if (config.isProduction && config.paymentProvider === "mock") {
  // eslint-disable-next-line no-console
  console.warn(
    "WARNING: PAYMENT_PROVIDER=mock in production. Real payments will NOT be processed. Set PAYMENT_PROVIDER=moyasar and configure your Moyasar keys before going live."
  );
}
