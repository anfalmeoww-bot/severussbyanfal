import type { Ctx } from "../../lib/router";
import { t } from "../../lib/i18n";
import { deerLogoSvg } from "../logo";
import { escapeHtml } from "../../lib/render";
import { csrfTokenFor } from "../../lib/auth";

export interface AdminLayoutOptions {
  ctx: Ctx;
  title: string;
  active: "dashboard" | "products" | "categories" | "orders";
  body: string;
  extraScripts?: string;
}

export function renderAdminLayout(opts: AdminLayoutOptions): string {
  const { ctx } = opts;
  const T = (key: string) => t(ctx.locale, key);
  const dir = ctx.locale === "ar" ? "rtl" : "ltr";
  const csrfToken = ctx.session ? csrfTokenFor(ctx.session) : "";

  const nav = [
    { key: "dashboard", href: "/admin", label: T("admin_dashboard") },
    { key: "products", href: "/admin/products", label: T("admin_products") },
    { key: "categories", href: "/admin/categories", label: T("admin_categories") },
    { key: "orders", href: "/admin/orders", label: T("admin_orders") },
  ];

  return `<!doctype html>
<html lang="${ctx.locale}" dir="${dir}" data-theme="${ctx.theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(opts.title)} · ${T("admin_dashboard")}</title>
<link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
<link rel="stylesheet" href="/css/styles.css">
<meta name="csrf-token" content="${csrfToken}">
</head>
<body data-locale="${ctx.locale}">
<div class="admin-shell">
  <aside class="admin-sidebar">
    <a href="/" class="admin-brand">
      <span class="brand-mark">${deerLogoSvg({ size: 30, color: "#ffffff" })}</span>
      <span>${T("app_name")}</span>
    </a>
    <nav class="admin-nav">
      ${nav
        .map(
          (item) =>
            `<a href="${item.href}" class="admin-nav-link ${opts.active === item.key ? "active" : ""}">${escapeHtml(item.label)}</a>`
        )
        .join("\n")}
    </nav>
    <a href="/" class="admin-back-link">← ${T("back_to_store")}</a>
  </aside>
  <main class="admin-main">
    <div class="admin-topbar">
      <h1>${escapeHtml(opts.title)}</h1>
      <div class="lang-switch">
        <a href="/api/locale/ar?redirect=${encodeURIComponent(ctx.url.pathname)}" class="lang-opt ${ctx.locale === "ar" ? "active" : ""}">AR</a>
        <span class="lang-sep">/</span>
        <a href="/api/locale/en?redirect=${encodeURIComponent(ctx.url.pathname)}" class="lang-opt ${ctx.locale === "en" ? "active" : ""}">EN</a>
      </div>
    </div>
    ${opts.body}
  </main>
</div>
<script>
window.__APP__ = ${JSON.stringify({ locale: ctx.locale, theme: ctx.theme, csrfToken, loggedIn: true, isAdmin: true })};
</script>
<script src="/js/app.js"></script>
${opts.extraScripts ?? ""}
</body>
</html>`;
}
