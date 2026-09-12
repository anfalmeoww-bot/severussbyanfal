import type { Ctx } from "../lib/router";
import { t } from "../lib/i18n";
import { escapeHtml, money } from "../lib/render";
import { renderLayout } from "./layout";
import type { ProductRow, ProductImageRow, CategoryRow } from "../db/repo";

export function renderHomePage(
  ctx: Ctx,
  products: ProductRow[],
  images: Record<string, ProductImageRow[]>,
  activeCategory: CategoryRow | null
): string {
  const T = (key: string) => t(ctx.locale, key);
  const title = activeCategory ? (ctx.locale === "ar" ? activeCategory.name_ar : activeCategory.name_en) : T("all_products");

  const grid = products.length
    ? `<div class="product-grid">
        ${products.map((p) => productCard(p, images[p.id] ?? [], ctx.locale)).join("\n")}
      </div>`
    : `<div class="empty-state">
        <p>${T("no_products_yet")}</p>
      </div>`;

  const body = `
    <div class="page-heading">
      <h1>${escapeHtml(title)}</h1>
    </div>
    ${grid}
  `;

  return renderLayout({
    ctx,
    title,
    body,
    activeCategorySlug: activeCategory?.slug ?? null,
    showSidebar: true,
  });
}

function productCard(product: ProductRow, images: ProductImageRow[], locale: "ar" | "en"): string {
  const T = (key: string) => t(locale, key);
  const name = locale === "ar" ? product.name_ar : product.name_en;
  const image = images[0]?.url;
  const outOfStock = product.stock <= 0;
  return `
  <article class="product-card">
    <a href="/product/${product.id}" class="product-card-link">
      <div class="product-thumb">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy">` : placeholderThumb()}
        ${outOfStock ? `<span class="stock-badge">${T("out_of_stock")}</span>` : ""}
      </div>
      <h3 class="product-name">${escapeHtml(name)}</h3>
      <p class="product-price">${money(product.price_cents, product.currency, locale)}</p>
    </a>
    <button type="button" class="btn btn-add-cart" data-add-to-cart data-product-id="${product.id}" ${outOfStock ? "disabled" : ""}>
      ${cartPlusIcon()} <span>${T("add_to_cart")}</span>
    </button>
  </article>`;
}

function placeholderThumb(): string {
  return `<div class="product-thumb-placeholder">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M4 16l4.5-6 3.5 4.5 2.5-3L20 16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.4"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/></svg>
  </div>`;
}

function cartPlusIcon(): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.6L20 8H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="20.5" r="1.3" fill="currentColor"/><circle cx="17" cy="20.5" r="1.3" fill="currentColor"/></svg>`;
}
