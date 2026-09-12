import type { Ctx } from "../lib/router";
import { t } from "../lib/i18n";
import { escapeHtml, money } from "../lib/render";
import { renderLayout } from "./layout";
import { getCartItems } from "../db/repo";

export function renderCartPage(ctx: Ctx): string {
  const T = (key: string) => t(ctx.locale, key);
  const locale = ctx.locale;
  const items = ctx.session ? getCartItems(ctx.session.user.id) : [];
  const subtotal = items.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0);
  const currency = items[0]?.product.currency || "SAR";

  const body = items.length
    ? `
    <div class="page-heading"><h1>${T("cart_title")}</h1></div>
    <div class="cart-layout">
      <div class="cart-items" id="cart-items">
        ${items
          .map(
            (item) => `
          <div class="cart-item" data-product-id="${item.product_id}">
            <div class="cart-item-thumb">
              ${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : `<div class="product-thumb-placeholder small"></div>`}
            </div>
            <div class="cart-item-info">
              <a href="/product/${item.product_id}" class="cart-item-name">${escapeHtml(locale === "ar" ? item.product.name_ar : item.product.name_en)}</a>
              <p class="cart-item-price">${money(item.product.price_cents, item.product.currency, locale)}</p>
            </div>
            <div class="cart-item-qty">
              <input type="number" min="1" max="${Math.max(1, item.product.stock)}" value="${item.quantity}" data-qty-input data-product-id="${item.product_id}">
            </div>
            <div class="cart-item-line-total">${money(item.product.price_cents * item.quantity, item.product.currency, locale)}</div>
            <button type="button" class="cart-item-remove" data-remove-item data-product-id="${item.product_id}" aria-label="${T("remove")}">✕</button>
          </div>`
          )
          .join("\n")}
      </div>
      <div class="cart-summary">
        <div class="cart-summary-row">
          <span>${T("subtotal")}</span>
          <span id="cart-subtotal">${money(subtotal, currency, locale)}</span>
        </div>
        <div class="cart-summary-row total">
          <span>${T("total")}</span>
          <span id="cart-total">${money(subtotal, currency, locale)}</span>
        </div>
        <button type="button" class="btn btn-primary btn-block" id="checkout-btn">${T("checkout")}</button>
      </div>
    </div>
    <div id="checkout-form-modal" class="modal" hidden>
      <div class="modal-card">
        <h2>${T("shipping_details")}</h2>
        <form id="checkout-form">
          <label>${T("full_name")}<input name="name" required maxlength="120"></label>
          <label>${T("phone_number")}<input name="phone" type="tel" required placeholder="${T("phone_placeholder")}"></label>
          <label>${T("city")}<input name="city" required maxlength="80"></label>
          <label>${T("address")}<textarea name="address" required maxlength="300"></textarea></label>
          <p class="field-error" id="checkout-error" hidden></p>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" id="checkout-cancel">${T("cancel")}</button>
            <button type="submit" class="btn btn-primary">${T("place_order")}</button>
          </div>
        </form>
      </div>
    </div>`
    : `
    <div class="empty-state">
      <p>${T("cart_empty")}</p>
      <a href="/" class="btn btn-primary">${T("browse_products")}</a>
    </div>`;

  return renderLayout({ ctx, title: T("cart_title"), body, showSidebar: true, extraScripts: `<script src="/js/cart.js"></script>` });
}
