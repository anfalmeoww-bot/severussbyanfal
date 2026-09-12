import http from "node:http";
import { config } from "./config";
import "./db"; // ensure DB + migrations are initialized before anything else
import { Router } from "./lib/router";
import { isStaticPath, serveStatic } from "./lib/staticFiles";
import { pruneOtpCodes } from "./lib/otp";

import { registerAuthRoutes } from "./routes/auth";
import { registerAccountRoutes } from "./routes/account";
import { registerProductRoutes } from "./routes/products";
import { registerCartRoutes } from "./routes/cart";
import { registerOrderRoutes } from "./routes/orders";
import { registerAdminDashboardRoutes } from "./routes/admin/dashboard";
import { registerAdminProductRoutes } from "./routes/admin/products";
import { registerAdminCategoryRoutes } from "./routes/admin/categories";
import { registerAdminOrderRoutes } from "./routes/admin/orders";

const router = new Router();

registerAuthRoutes(router);
registerAccountRoutes(router);
registerProductRoutes(router);
registerCartRoutes(router);
registerOrderRoutes(router);
registerAdminDashboardRoutes(router);
registerAdminProductRoutes(router);
registerAdminCategoryRoutes(router);
registerAdminOrderRoutes(router);

router.get("/.well-known/apple-developer-merchantid-domain-association", (ctx) => {
  if (!config.applePayDomainAssociation) {
    ctx.html(404, "Not configured.");
    return;
  }
  ctx.res.writeHead(200, { "Content-Type": "text/plain" });
  ctx.res.end(config.applePayDomainAssociation);
});

router.get("/healthz", (ctx) => {
  ctx.json(200, { ok: true, store: config.storeName });
});

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  // Allow Moyasar's hosted payment script/styles + our own same-origin assets.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.moyasar.com",
    "style-src 'self' 'unsafe-inline' https://cdn.moyasar.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.moyasar.com",
    "frame-src https://api.moyasar.com https://cdn.moyasar.com",
    "font-src 'self' data:",
  ].join("; "),
};

const server = http.createServer(async (req, res) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  if (config.isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }

  const pathname = (req.url || "/").split("?")[0];
  if (isStaticPath(pathname) && serveStatic(req, res, pathname)) {
    return;
  }

  await router.handle(req, res);
});

// Periodically clean up expired OTP codes.
setInterval(pruneOtpCodes, 30 * 60 * 1000).unref();

server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`\n${config.storeName} is running:`);
  console.log(`  → ${config.baseUrl}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  SMS provider: ${config.smsProvider}`);
  console.log(`  Payment provider: ${config.paymentProvider}`);
  if (config.adminPhoneNumbers.length === 0) {
    console.warn("  WARNING: ADMIN_PHONE_NUMBERS is empty — no account will have admin access.");
  } else {
    console.log(`  Admin phone(s): ${config.adminPhoneNumbers.join(", ")}`);
  }
  console.log("");
});
