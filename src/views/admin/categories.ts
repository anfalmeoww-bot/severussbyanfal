import type { Ctx } from "../../lib/router";
import { t } from "../../lib/i18n";
import { renderAdminLayout } from "./layout";

export function renderAdminCategoriesPage(ctx: Ctx): string {
  const T = (key: string) => t(ctx.locale, key);
  const body = `
  <div class="admin-toolbar">
    <button type="button" class="btn btn-primary" id="add-category-btn">${T("add_category")}</button>
  </div>
  <div id="categories-list" class="admin-table-wrap">
    <p class="loading-text">…</p>
  </div>

  <div id="category-modal" class="modal" hidden>
    <div class="modal-card">
      <h2 id="category-modal-title">${T("add_category")}</h2>
      <form id="category-form">
        <input type="hidden" name="id">
        <label>${T("category_name_en")}<input name="nameEn" maxlength="80" required></label>
        <label>${T("category_name_ar")}<input name="nameAr" maxlength="80" required dir="rtl"></label>
        <p class="field-error" id="category-form-error" hidden></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="category-modal-cancel">${T("cancel")}</button>
          <button type="submit" class="btn btn-primary">${T("save")}</button>
        </div>
      </form>
    </div>
  </div>`;
  return renderAdminLayout({
    ctx,
    title: T("admin_categories"),
    active: "categories",
    body,
    extraScripts: `<script src="/js/admin-categories.js"></script>`,
  });
}
