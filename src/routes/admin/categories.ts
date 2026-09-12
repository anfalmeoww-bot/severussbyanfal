import type { Router } from "../../lib/router";
import { HttpError } from "../../lib/http";
import { requireAdmin, requireCsrf } from "../../middleware/guards";
import { requireString } from "../../lib/validate";
import { listCategories, createCategory, updateCategory, deleteCategory, getCategoryById } from "../../db/repo";
import { renderAdminCategoriesPage } from "../../views/admin/categories";

export function registerAdminCategoryRoutes(router: Router) {
  router.get("/admin/categories", (ctx) => {
    requireAdmin(ctx);
    ctx.html(200, renderAdminCategoriesPage(ctx));
  });

  router.get("/api/admin/categories", (ctx) => {
    requireAdmin(ctx);
    ctx.json(200, { categories: listCategories() });
  });

  router.post("/api/admin/categories", async (ctx) => {
    requireAdmin(ctx);
    requireCsrf(ctx);
    const body = await ctx.jsonBody<{ nameEn?: string; nameAr?: string }>();
    const nameEn = requireString(body.nameEn || body.nameAr, "Category name (English)", { max: 80 });
    const nameAr = requireString(body.nameAr || body.nameEn, "Category name (Arabic)", { max: 80 });
    const category = createCategory(nameEn, nameAr);
    ctx.json(201, { ok: true, category });
  });

  router.put("/api/admin/categories/:id", async (ctx) => {
    requireAdmin(ctx);
    requireCsrf(ctx);
    if (!getCategoryById(ctx.params.id)) throw new HttpError(404, "Category not found.");
    const body = await ctx.jsonBody<{ nameEn?: string; nameAr?: string }>();
    const nameEn = requireString(body.nameEn || body.nameAr, "Category name (English)", { max: 80 });
    const nameAr = requireString(body.nameAr || body.nameEn, "Category name (Arabic)", { max: 80 });
    const category = updateCategory(ctx.params.id, nameEn, nameAr);
    ctx.json(200, { ok: true, category });
  });

  router.delete("/api/admin/categories/:id", (ctx) => {
    requireAdmin(ctx);
    requireCsrf(ctx);
    if (!getCategoryById(ctx.params.id)) throw new HttpError(404, "Category not found.");
    deleteCategory(ctx.params.id);
    ctx.json(200, { ok: true });
  });
}
