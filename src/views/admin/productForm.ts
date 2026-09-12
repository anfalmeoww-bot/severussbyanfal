import type { Ctx } from "../../lib/router";
import { t } from "../../lib/i18n";
import { escapeHtml } from "../../lib/render";
import { renderAdminLayout } from "./layout";
import { listCategories, type ProductRow, type ProductImageRow } from "../../db/repo";
import { config } from "../../config";

export function renderAdminProductFormPage(ctx: Ctx, product: ProductRow | null, images: ProductImageRow[]): string {
  const T = (key: string) => t(ctx.locale, key);
  const categories = listCategories();
  const isEdit = !!product;

  const categoryOptions = `<option value="">${T("no_category")}</option>` +
    categories
      .map(
        (c) =>
          `<option value="${c.id}" ${product?.category_id === c.id ? "selected" : ""}>${escapeHtml(ctx.locale === "ar" ? c.name_ar : c.name_en)}</option>`
      )
      .join("");

  const existingImages = images
    .map(
      (img) => `
      <div class="image-thumb" data-image-id="${img.id}">
        <img src="${escapeHtml(img.url)}" alt="">
        <button type="button" class="image-remove" data-remove-image="${img.id}">✕</button>
      </div>`
    )
    .join("");

  const body = `
  <form id="product-form" class="admin-form" data-product-id="${product?.id ?? ""}">
    <div class="admin-form-grid">
      <label>${T("product_name_en")}<input name="nameEn" required maxlength="150" value="${escapeHtml(product?.name_en ?? "")}"></label>
      <label>${T("product_name_ar")}<input name="nameAr" required maxlength="150" dir="rtl" value="${escapeHtml(product?.name_ar ?? "")}"></label>
      <label class="span-2">${T("product_desc_en")}<textarea name="descriptionEn" maxlength="4000">${escapeHtml(product?.description_en ?? "")}</textarea></label>
      <label class="span-2">${T("product_desc_ar")}<textarea name="descriptionAr" maxlength="4000" dir="rtl">${escapeHtml(product?.description_ar ?? "")}</textarea></label>
      <label>${T("price")} (${config.defaultCurrency})<input name="price" type="number" step="0.01" min="0" required value="${product ? (product.price_cents / 100).toFixed(2) : ""}"></label>
      <label>${T("stock")}<input name="stock" type="number" min="0" step="1" required value="${product?.stock ?? 0}"></label>
      <label>${T("category")}<select name="categoryId">${categoryOptions}</select></label>
      <label class="checkbox-label"><input type="checkbox" name="isActive" ${product?.is_active !== 0 ? "checked" : ""}> ${ctx.locale === "ar" ? "منشور وظاهر للعملاء" : "Active / visible to customers"}</label>
    </div>

    <div class="admin-form-section">
      <h3>${T("images")}</h3>
      <div class="image-thumb-grid" id="image-thumb-grid">
        ${existingImages}
      </div>
      <input type="file" id="image-file-input" accept="image/png,image/jpeg,image/webp,image/gif" multiple>
      <p class="form-hint">${ctx.locale === "ar" ? "PNG أو JPEG أو WEBP، حتى 4 ميجابايت لكل صورة." : "PNG, JPEG or WEBP, up to 4MB each."}</p>
    </div>

    <p class="field-error" id="product-form-error" hidden></p>
    <div class="admin-form-actions">
      <a href="/admin/products" class="btn btn-ghost">${T("cancel")}</a>
      <button type="submit" class="btn btn-primary">${isEdit ? T("update") : T("create")}</button>
    </div>
  </form>`;

  return renderAdminLayout({
    ctx,
    title: isEdit ? T("edit") : T("add_product"),
    active: "products",
    body,
    extraScripts: `<script src="/js/admin-product-form.js"></script>`,
  });
}
