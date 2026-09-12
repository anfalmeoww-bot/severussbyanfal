import type { Router } from "../../lib/router";
import { HttpError } from "../../lib/http";
import { requireAdmin, requireCsrf } from "../../middleware/guards";
import { requireString, optionalString, requirePriceCents, requirePositiveInt } from "../../lib/validate";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listProductImages,
  addProductImage,
  deleteProductImage,
  getProductImageById,
  listImagesForProducts,
  getCategoryById,
  type ProductInput,
} from "../../db/repo";
import { saveBase64Image, deleteUploadedImage } from "../../lib/uploads";
import { config } from "../../config";
import { renderAdminProductsPage } from "../../views/admin/products";
import { renderAdminProductFormPage } from "../../views/admin/productForm";

function parseProductInput(body: any): ProductInput {
  const categoryId = body.categoryId ? String(body.categoryId) : null;
  if (categoryId && !getCategoryById(categoryId)) {
    throw new HttpError(400, "Selected category does not exist.");
  }
  return {
    categoryId,
    nameEn: requireString(body.nameEn, "Product name (English)", { max: 150 }),
    nameAr: requireString(body.nameAr, "Product name (Arabic)", { max: 150 }),
    descriptionEn: optionalString(body.descriptionEn, { max: 4000 }),
    descriptionAr: optionalString(body.descriptionAr, { max: 4000 }),
    priceCents: requirePriceCents(body.priceCents),
    currency: optionalString(body.currency, { max: 8 }) || config.defaultCurrency,
    stock: requirePositiveInt(body.stock ?? 0, "Stock"),
    isActive: body.isActive !== false,
  };
}

export function registerAdminProductRoutes(router: Router) {
  router.get("/admin/products", (ctx) => {
    requireAdmin(ctx);
    ctx.html(200, renderAdminProductsPage(ctx));
  });

  router.get("/admin/products/new", (ctx) => {
    requireAdmin(ctx);
    ctx.html(200, renderAdminProductFormPage(ctx, null, []));
  });

  router.get("/admin/products/:id/edit", (ctx) => {
    requireAdmin(ctx);
    const product = getProductById(ctx.params.id);
    if (!product) throw new HttpError(404, "Product not found.");
    ctx.html(200, renderAdminProductFormPage(ctx, product, listProductImages(product.id)));
  });

  router.get("/api/admin/products", (ctx) => {
    requireAdmin(ctx);
    const products = listProducts({});
    const images = listImagesForProducts(products.map((p) => p.id));
    ctx.json(200, { products: products.map((p) => ({ ...p, images: images[p.id] ?? [] })) });
  });

  router.post("/api/admin/products", async (ctx) => {
    requireAdmin(ctx);
    requireCsrf(ctx);
    const body = await ctx.jsonBody<any>();
    const input = parseProductInput(body);
    const product = createProduct(input);
    if (Array.isArray(body.images)) {
      for (const dataUrl of body.images.slice(0, 8)) {
        const url = saveBase64Image(dataUrl);
        addProductImage(product.id, url);
      }
    }
    ctx.json(201, { ok: true, product });
  });

  router.put("/api/admin/products/:id", async (ctx) => {
    requireAdmin(ctx);
    requireCsrf(ctx);
    if (!getProductById(ctx.params.id)) throw new HttpError(404, "Product not found.");
    const body = await ctx.jsonBody<any>();
    const input = parseProductInput(body);
    const product = updateProduct(ctx.params.id, input);
    ctx.json(200, { ok: true, product });
  });

  router.delete("/api/admin/products/:id", (ctx) => {
    requireAdmin(ctx);
    requireCsrf(ctx);
    const product = getProductById(ctx.params.id);
    if (!product) throw new HttpError(404, "Product not found.");
    for (const img of listProductImages(product.id)) deleteUploadedImage(img.url);
    deleteProduct(product.id);
    ctx.json(200, { ok: true });
  });

  router.post("/api/admin/products/:id/images", async (ctx) => {
    requireAdmin(ctx);
    requireCsrf(ctx);
    const product = getProductById(ctx.params.id);
    if (!product) throw new HttpError(404, "Product not found.");
    const body = await ctx.jsonBody<{ image?: string }>();
    if (!body.image) throw new HttpError(400, "image is required.");
    const url = saveBase64Image(body.image);
    const image = addProductImage(product.id, url);
    ctx.json(201, { ok: true, image });
  });

  router.delete("/api/admin/images/:id", (ctx) => {
    requireAdmin(ctx);
    requireCsrf(ctx);
    const image = getProductImageById(ctx.params.id);
    if (image) deleteUploadedImage(image.url);
    deleteProductImage(ctx.params.id);
    ctx.json(200, { ok: true });
  });
}
