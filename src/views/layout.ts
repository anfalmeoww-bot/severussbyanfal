import type { Ctx } from "../lib/router";
import { t, dirFor, type Locale } from "../lib/i18n";
import { escapeHtml } from "../lib/render";
import { deerLogoSvg } from "./logo";
import { csrfTokenFor } from "../lib/auth";
import { listCategories } from "../db/repo";
import { getCartItems } from "../db/repo";

export interface LayoutOptions {
  ctx: Ctx;
  title: string;
  body: string;
  activeCategorySlug?: string | null;
  showSidebar?: boolean;
  extraHead?: string;
  extraScripts?: string;
}

export function renderLayout(opts: LayoutOptions): string {
  const { ctx } = opts;
  const locale: Locale = ctx.locale;
  const dir = dirFor(locale);
  const T = (key: string) => t(locale, key);
  const session = ctx.session;
  const csrfToken = session ? csrfTokenFor(session) : "";
  const cartCount = session ? getCartItems(session.user.id).reduce((s, i) => s + i.quantity, 0) : 0;
  const categories = opts.showSidebar !== false ? listCategories() : [];

  const headerRight = session
    ? `
    <div class="nav-right">
      <a class="icon-link cart-link" href="/cart" aria-label="${T("nav_cart")}">
        ${cartIconSvg()}
        ${cartCount > 0 ? `<span class="badge" id="cart-badge">${cartCount}</span>` : `<span class="badge" id="cart-badge" hidden>0</span>`}
      </a>
      ${
        session.user.role === "admin"
          ? `<a class="pill-link" href="/admin">${T("nav_admin")}</a>`
          : ""
      }
      <div class="profile-menu">
        <button type="button" class="profile-trigger" id="profile-trigger" aria-haspopup="true" aria-expanded="false">
          <span class="avatar">${escapeHtml((session.user.name || session.user.phone).slice(0, 1).toUpperCase())}</span>
          <span class="profile-name">${escapeHtml(session.user.name || session.user.phone)}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="profile-dropdown" id="profile-dropdown" hidden>
          <a href="/account">${T("my_account")}</a>
          <a href="/orders">${T("nav_orders")}</a>
          <div class="dropdown-section">
            <span class="dropdown-label">${T("theme")}</span>
            <div class="theme-options">
              <button type="button" class="theme-opt ${ctx.theme === "light-blue" ? "active" : ""}" data-theme-choice="light-blue">${T("theme_light_blue")}</button>
              <button type="button" class="theme-opt ${ctx.theme === "dark-blue" ? "active" : ""}" data-theme-choice="dark-blue">${T("theme_dark_blue")}</button>
            </div>
          </div>
          <button type="button" class="dropdown-logout" id="logout-btn">${T("logout")}</button>
        </div>
      </div>
    </div>`
    : `
    <div class="nav-right">
      <a class="pill-link" href="/login">${T("login")}</a>
    </div>`;

  const sidebarHtml =
    opts.showSidebar !== false
      ? `
    <aside class="sidebar">
      <h2 class="sidebar-title">${T("categories")}</h2>
      <nav class="sidebar-nav">
        <a href="/" class="sidebar-link ${!opts.activeCategorySlug ? "active" : ""}">${T("all_products")}</a>
        ${categories
          .map(
            (c) =>
              `<a href="/category/${encodeURIComponent(c.slug)}" class="sidebar-link ${opts.activeCategorySlug === c.slug ? "active" : ""}">${escapeHtml(locale === "ar" ? c.name_ar : c.name_en)}</a>`
          )
          .join("\n")}
      </nav>
    </aside>`
      : "";

  return `<!doctype html>
<html lang="${locale}" dir="${dir}" data-theme="${ctx.theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(opts.title)} · ${T("app_name")}</title>
<meta name="description" content="${T("app_name")} — ${T("welcome_back")}">
<link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<link rel="stylesheet" href="/css/styles.css">
<meta name="csrf-token" content="${csrfToken}">
${opts.extraHead ?? ""}
</head>
<body data-locale="${locale}">
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="brand">
      <span class="brand-mark">${deerLogoSvg({ size: 34, color: "#ffffff" })}</span>
      <span class="brand-name">${T("app_name")}</span>
    </a>
    <div class="lang-switch">
      <a href="/api/locale/ar?redirect=${encodeURIComponent(ctx.url.pathname)}" class="lang-opt ${locale === "ar" ? "active" : ""}">AR</a>
      <span class="lang-sep">/</span>
      <a href="/api/locale/en?redirect=${encodeURIComponent(ctx.url.pathname)}" class="lang-opt ${locale === "en" ? "active" : ""}">EN</a>
    </div>
    ${headerRight}
  </div>
</header>
<div class="page-shell ${opts.showSidebar !== false ? "with-sidebar" : ""}">
  ${sidebarHtml}
  <main class="main-content">
    ${opts.body}
  </main>
</div>
<footer class="site-footer">
  <p>© ${new Date().getFullYear()} ${T("app_name")}</p>
</footer>
<script>
window.__APP__ = ${JSON.stringify({ locale, theme: ctx.theme, csrfToken, loggedIn: !!session, isAdmin: session?.user.role === "admin" })};
</script>
<script src="/js/app.js"></script>
${opts.extraScripts ?? ""}
</body>
</html>`;
}

function cartIconSvg(): string {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.6L20 8H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="20.5" r="1.4" fill="currentColor"/><circle cx="17" cy="20.5" r="1.4" fill="currentColor"/></svg>`;
}
