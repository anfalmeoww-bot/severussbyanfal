import type { Router } from "../lib/router";
import { HttpError } from "../lib/http";
import { requireAuth } from "../middleware/guards";
import { listProducts, listImagesForProducts, getProductById, listProductImages, getCategoryBySlug } from "../db/repo";
import { renderHomePage } from "../views/home";
import { renderProductPage } from "../views/product";

export function registerProductRoutes(router: Router) {
  router.get("/", (ctx) => {
    if (!ctx.session) {
      ctx.redirect("/login");
      return;
    }
    const products = listProducts({ activeOnly: true });
    const images = listImagesForProducts(products.map((p) => p.id));
    ctx.html(200, renderHomePage(ctx, products, images, null));
  });

  router.get("/category/:slug", (ctx) => {
    if (!ctx.session) {
      ctx.redirect("/login");
      return;
    }
    const category = getCategoryBySlug(ctx.params.slug);
    if (!category) throw new HttpError(404, "Category not found.");
    const products = listProducts({ activeOnly: true, categoryId: category.id });
    const images = listImagesForProducts(products.map((p) => p.id));
    ctx.html(200, renderHomePage(ctx, products, images, category));
  });

  router.get("/product/:id", (ctx) => {
    if (!ctx.session) {
      ctx.redirect("/login");
      return;
    }
    const product = getProductById(ctx.params.id);
    if (!product || !product.is_active) throw new HttpError(404, "Product not found.");
    const images = listProductImages(product.id);
    ctx.html(200, renderProductPage(ctx, product, images));
  });

  // Lightweight JSON listing, handy if you later want to fetch products via AJAX.
  router.get("/api/products", (ctx) => {
    requireAuth(ctx);
    const categorySlug = ctx.query.get("category");
    let categoryId: string | undefined;
    if (categorySlug) {
      const category = getCategoryBySlug(categorySlug);
      if (!category) throw new HttpError(404, "Category not found.");
      categoryId = category.id;
    }
    const products = listProducts({ activeOnly: true, categoryId });
    const images = listImagesForProducts(products.map((p) => p.id));
    ctx.json(200, {
      products: products.map((p) => ({ ...p, images: images[p.id] ?? [] })),
    });
  });
}
