import type { Ctx } from "../lib/router";
import { t } from "../lib/i18n";
import { escapeHtml, money } from "../lib/render";
import { renderLayout } from "./layout";
import type { ProductRow, ProductImageRow } from "../db/repo";

export function renderProductPage(ctx: Ctx, product: ProductRow, images: ProductImageRow[]): string {
  const T = (key: string) => t(ctx.locale, key);
  const locale = ctx.locale;
  const name = locale === "ar" ? product.name_ar : product.name_en;
  const description = locale === "ar" ? product.description_ar : product.description_en;
  const outOfStock = product.stock <= 0;

  const gallery = images.length
    ? `<div class="product-gallery">
        <div class="product-gallery-main">
          <img id="gallery-main-img" src="${escapeHtml(images[0].url)}" alt="${escapeHtml(name)}">
        </div>
        ${
          images.length > 1
            ? `<div class="product-gallery-thumbs">
                ${images
                  .map(
                    (img, i) =>
                      `<button type="button" class="gallery-thumb ${i === 0 ? "active" : ""}" data-src="${escapeHtml(img.url)}"><img src="${escapeHtml(img.url)}" alt=""></button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>`
    : `<div class="product-gallery"><div class="product-gallery-main product-gallery-empty"><svg width="64" height="64" viewBox="0 0 24 24" fill="none"><path d="M4 16l4.5-6 3.5 4.5 2.5-3L20 16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.2"/></svg></div></div>`;

  const body = `
  <div class="product-detail">
    ${gallery}
    <div class="product-info">
      <h1>${escapeHtml(name)}</h1>
      <p class="product-detail-price">${money(product.price_cents, product.currency, locale)}</p>
      ${outOfStock ? `<p class="stock-badge inline">${T("out_of_stock")}</p>` : ""}
      <h2 class="section-label">${T("description")}</h2>
      <p class="product-detail-desc">${escapeHtml(description || "").replace(/\n/g, "<br>")}</p>
      <div class="product-detail-actions">
        <label class="qty-label" for="qty-input">${T("quantity")}</label>
        <input type="number" id="qty-input" min="1" max="${Math.max(1, product.stock)}" value="1" ${outOfStock ? "disabled" : ""}>
        <button type="button" class="btn btn-primary" id="detail-add-cart" data-product-id="${product.id}" ${outOfStock ? "disabled" : ""}>
          ${T("add_to_cart")}
        </button>
      </div>
    </div>
  </div>`;

  return renderLayout({ ctx, title: name, body, showSidebar: true });
}
