import { all, get, run, now } from "./index";
import { newId } from "../lib/ids";
import { HttpError } from "../lib/http";
import { slugify } from "../lib/validate";
import type { UserRow } from "../lib/auth";

// ─────────────────────────────── Users ───────────────────────────────

export function getUserById(id: string): UserRow | undefined {
  return get<UserRow>(`SELECT * FROM users WHERE id = @id`, { id });
}

export function getUserByPhone(phone: string): UserRow | undefined {
  return get<UserRow>(`SELECT * FROM users WHERE phone = @phone`, { phone });
}

export function createUser(phone: string, role: "customer" | "admin"): UserRow {
  const id = newId();
  const ts = now();
  run(
    `INSERT INTO users (id, phone, name, role, theme, locale, created_at, updated_at)
     VALUES (@id, @phone, NULL, @role, 'light-blue', 'ar', @ts, @ts)`,
    { id, phone, role, ts }
  );
  return getUserById(id)!;
}

export function updateUserName(userId: string, name: string) {
  run(`UPDATE users SET name = @name, updated_at = @ts WHERE id = @id`, { name, ts: now(), id: userId });
}

export function updateUserPhone(userId: string, phone: string) {
  const existing = getUserByPhone(phone);
  if (existing && existing.id !== userId) {
    throw new HttpError(409, "This phone number is already associated with another account.");
  }
  run(`UPDATE users SET phone = @phone, updated_at = @ts WHERE id = @id`, { phone, ts: now(), id: userId });
}

export function updateUserTheme(userId: string, theme: "light-blue" | "dark-blue") {
  run(`UPDATE users SET theme = @theme, updated_at = @ts WHERE id = @id`, { theme, ts: now(), id: userId });
}

export function updateUserLocale(userId: string, locale: "ar" | "en") {
  run(`UPDATE users SET locale = @locale, updated_at = @ts WHERE id = @id`, { locale, ts: now(), id: userId });
}

// ────────────────────────────── Categories ─────────────────────────────

export interface CategoryRow {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export function listCategories(): CategoryRow[] {
  return all<CategoryRow>(`SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC`);
}

export function getCategoryById(id: string): CategoryRow | undefined {
  return get<CategoryRow>(`SELECT * FROM categories WHERE id = @id`, { id });
}

export function getCategoryBySlug(slug: string): CategoryRow | undefined {
  return get<CategoryRow>(`SELECT * FROM categories WHERE slug = @slug`, { slug });
}

function uniqueSlug(base: string): string {
  let slug = slugify(base);
  let candidate = slug;
  let n = 2;
  while (getCategoryBySlug(candidate)) {
    candidate = `${slug}-${n}`;
    n++;
  }
  return candidate;
}

export function createCategory(nameEn: string, nameAr: string): CategoryRow {
  const id = newId();
  const ts = now();
  const maxOrder = get<{ m: number }>(`SELECT COALESCE(MAX(sort_order), -1) as m FROM categories`)!.m;
  run(
    `INSERT INTO categories (id, slug, name_en, name_ar, sort_order, created_at, updated_at)
     VALUES (@id, @slug, @nameEn, @nameAr, @sortOrder, @ts, @ts)`,
    { id, slug: uniqueSlug(nameEn || nameAr), nameEn, nameAr, sortOrder: maxOrder + 1, ts }
  );
  return getCategoryById(id)!;
}

export function updateCategory(id: string, nameEn: string, nameAr: string): CategoryRow {
  const existing = getCategoryById(id);
  if (!existing) throw new HttpError(404, "Category not found.");
  run(`UPDATE categories SET name_en = @nameEn, name_ar = @nameAr, updated_at = @ts WHERE id = @id`, {
    nameEn,
    nameAr,
    ts: now(),
    id,
  });
  return getCategoryById(id)!;
}

export function deleteCategory(id: string) {
  run(`DELETE FROM categories WHERE id = @id`, { id });
}

// ─────────────────────────────── Products ──────────────────────────────

export interface ProductRow {
  id: string;
  category_id: string | null;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price_cents: number;
  currency: string;
  stock: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}

export function listProducts(opts: { categoryId?: string; activeOnly?: boolean } = {}): ProductRow[] {
  const clauses: string[] = [];
  const params: Record<string, any> = {};
  if (opts.categoryId) {
    clauses.push("category_id = @categoryId");
    params.categoryId = opts.categoryId;
  }
  if (opts.activeOnly) {
    clauses.push("is_active = 1");
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return all<ProductRow>(`SELECT * FROM products ${where} ORDER BY created_at DESC`, params);
}

export function getProductById(id: string): ProductRow | undefined {
  return get<ProductRow>(`SELECT * FROM products WHERE id = @id`, { id });
}

export function listProductImages(productId: string): ProductImageRow[] {
  return all<ProductImageRow>(`SELECT * FROM product_images WHERE product_id = @productId ORDER BY sort_order ASC`, {
    productId,
  });
}

export function listImagesForProducts(productIds: string[]): Record<string, ProductImageRow[]> {
  if (productIds.length === 0) return {};
  const placeholders = productIds.map((_, i) => `@id${i}`).join(",");
  const params: Record<string, any> = {};
  productIds.forEach((id, i) => (params[`id${i}`] = id));
  const rows = all<ProductImageRow>(
    `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order ASC`,
    params
  );
  const out: Record<string, ProductImageRow[]> = {};
  for (const row of rows) {
    (out[row.product_id] ??= []).push(row);
  }
  return out;
}

export interface ProductInput {
  categoryId: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priceCents: number;
  currency: string;
  stock: number;
  isActive: boolean;
}

export function createProduct(input: ProductInput): ProductRow {
  const id = newId();
  const ts = now();
  run(
    `INSERT INTO products (id, category_id, name_en, name_ar, description_en, description_ar, price_cents, currency, stock, is_active, created_at, updated_at)
     VALUES (@id, @categoryId, @nameEn, @nameAr, @descriptionEn, @descriptionAr, @priceCents, @currency, @stock, @isActive, @ts, @ts)`,
    {
      id,
      categoryId: input.categoryId,
      nameEn: input.nameEn,
      nameAr: input.nameAr,
      descriptionEn: input.descriptionEn,
      descriptionAr: input.descriptionAr,
      priceCents: input.priceCents,
      currency: input.currency,
      stock: input.stock,
      isActive: input.isActive ? 1 : 0,
      ts,
    }
  );
  return getProductById(id)!;
}

export function updateProduct(id: string, input: ProductInput): ProductRow {
  const existing = getProductById(id);
  if (!existing) throw new HttpError(404, "Product not found.");
  run(
    `UPDATE products SET category_id = @categoryId, name_en = @nameEn, name_ar = @nameAr,
       description_en = @descriptionEn, description_ar = @descriptionAr, price_cents = @priceCents,
       currency = @currency, stock = @stock, is_active = @isActive, updated_at = @ts WHERE id = @id`,
    {
      id,
      categoryId: input.categoryId,
      nameEn: input.nameEn,
      nameAr: input.nameAr,
      descriptionEn: input.descriptionEn,
      descriptionAr: input.descriptionAr,
      priceCents: input.priceCents,
      currency: input.currency,
      stock: input.stock,
      isActive: input.isActive ? 1 : 0,
      ts: now(),
    }
  );
  return getProductById(id)!;
}

export function deleteProduct(id: string) {
  run(`DELETE FROM products WHERE id = @id`, { id });
}

export function addProductImage(productId: string, url: string): ProductImageRow {
  const id = newId();
  const maxOrder = get<{ m: number }>(`SELECT COALESCE(MAX(sort_order), -1) as m FROM product_images WHERE product_id = @productId`, {
    productId,
  })!.m;
  run(
    `INSERT INTO product_images (id, product_id, url, sort_order, created_at) VALUES (@id, @productId, @url, @sortOrder, @ts)`,
    { id, productId, url, sortOrder: maxOrder + 1, ts: now() }
  );
  return get<ProductImageRow>(`SELECT * FROM product_images WHERE id = @id`, { id })!;
}

export function getProductImageById(id: string): ProductImageRow | undefined {
  return get<ProductImageRow>(`SELECT * FROM product_images WHERE id = @id`, { id });
}

export function deleteProductImage(id: string) {
  run(`DELETE FROM product_images WHERE id = @id`, { id });
}

export function decrementStock(productId: string, quantity: number) {
  run(`UPDATE products SET stock = MAX(0, stock - @quantity), updated_at = @ts WHERE id = @id`, {
    quantity,
    ts: now(),
    id: productId,
  });
}

// ────────────────────────────── Cart ───────────────────────────────────

export interface CartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
}

export interface CartItemWithProduct extends CartItemRow {
  product: ProductRow;
  image: string | null;
}

export function getCartItems(userId: string): CartItemWithProduct[] {
  const items = all<CartItemRow>(`SELECT * FROM cart_items WHERE user_id = @userId ORDER BY created_at ASC`, {
    userId,
  });
  const results: CartItemWithProduct[] = [];
  for (const item of items) {
    const product = getProductById(item.product_id);
    if (!product) continue;
    const images = listProductImages(item.product_id);
    const firstImage: ProductImageRow | undefined = images[0];
    const image: string | null = firstImage ? firstImage.url : null;
    results.push({ ...item, product, image });
  }
  return results;
}

export function upsertCartItem(userId: string, productId: string, quantity: number) {
  const existing = get<CartItemRow>(`SELECT * FROM cart_items WHERE user_id = @userId AND product_id = @productId`, {
    userId,
    productId,
  });
  if (quantity <= 0) {
    if (existing) run(`DELETE FROM cart_items WHERE id = @id`, { id: existing.id });
    return;
  }
  if (existing) {
    run(`UPDATE cart_items SET quantity = @quantity, updated_at = @ts WHERE id = @id`, {
      quantity,
      ts: now(),
      id: existing.id,
    });
  } else {
    run(
      `INSERT INTO cart_items (id, user_id, product_id, quantity, created_at, updated_at)
       VALUES (@id, @userId, @productId, @quantity, @ts, @ts)`,
      { id: newId(), userId, productId, quantity, ts: now() }
    );
  }
}

export function removeCartItem(userId: string, productId: string) {
  run(`DELETE FROM cart_items WHERE user_id = @userId AND product_id = @productId`, { userId, productId });
}

export function clearCart(userId: string) {
  run(`DELETE FROM cart_items WHERE user_id = @userId`, { userId });
}

// ────────────────────────────── Orders ─────────────────────────────────

export interface OrderRow {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "failed" | "cancelled";
  subtotal_cents: number;
  total_cents: number;
  currency: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_city: string;
  shipping_address: string;
  payment_provider: string | null;
  payment_ref: string | null;
  created_at: number;
  updated_at: number;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_en: string;
  product_name_ar: string;
  unit_price_cents: number;
  quantity: number;
}

export interface ShippingInfo {
  name: string;
  phone: string;
  city: string;
  address: string;
}

export function createOrderFromCart(userId: string, shipping: ShippingInfo, currency: string): OrderRow {
  const items = getCartItems(userId);
  if (items.length === 0) {
    throw new HttpError(400, "Your cart is empty.");
  }
  for (const item of items) {
    if (item.product.stock < item.quantity) {
      throw new HttpError(
        409,
        `"${item.product.name_en}" only has ${item.product.stock} left in stock.`
      );
    }
  }
  const subtotal = items.reduce((sum, item) => sum + item.product.price_cents * item.quantity, 0);
  const total = subtotal; // shipping/tax hooks can be added here later

  const orderId = newId();
  const ts = now();
  run(
    `INSERT INTO orders (id, user_id, status, subtotal_cents, total_cents, currency, shipping_name, shipping_phone, shipping_city, shipping_address, created_at, updated_at)
     VALUES (@id, @userId, 'pending', @subtotal, @total, @currency, @name, @phone, @city, @address, @ts, @ts)`,
    {
      id: orderId,
      userId,
      subtotal,
      total,
      currency,
      name: shipping.name,
      phone: shipping.phone,
      city: shipping.city,
      address: shipping.address,
      ts,
    }
  );
  for (const item of items) {
    run(
      `INSERT INTO order_items (id, order_id, product_id, product_name_en, product_name_ar, unit_price_cents, quantity)
       VALUES (@id, @orderId, @productId, @nameEn, @nameAr, @unitPrice, @quantity)`,
      {
        id: newId(),
        orderId,
        productId: item.product_id,
        nameEn: item.product.name_en,
        nameAr: item.product.name_ar,
        unitPrice: item.product.price_cents,
        quantity: item.quantity,
      }
    );
  }
  return getOrderById(orderId)!;
}

export function getOrderById(id: string): OrderRow | undefined {
  return get<OrderRow>(`SELECT * FROM orders WHERE id = @id`, { id });
}

export function getOrderItems(orderId: string): OrderItemRow[] {
  return all<OrderItemRow>(`SELECT * FROM order_items WHERE order_id = @orderId`, { orderId });
}

export function listOrdersForUser(userId: string): OrderRow[] {
  return all<OrderRow>(`SELECT * FROM orders WHERE user_id = @userId ORDER BY created_at DESC`, { userId });
}

export function listAllOrders(): OrderRow[] {
  return all<OrderRow>(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 500`);
}

/**
 * Marks an order paid exactly once. If it's already paid (e.g. both the
 * customer's redirect *and* the webhook tried to confirm it), this is a
 * harmless no-op — stock is only decremented the first time.
 */
export function markOrderPaid(orderId: string, provider: string, paymentRef: string) {
  const order = getOrderById(orderId);
  if (!order) throw new HttpError(404, "Order not found.");
  if (order.status === "paid") return order;
  run(
    `UPDATE orders SET status = 'paid', payment_provider = @provider, payment_ref = @paymentRef, updated_at = @ts WHERE id = @id`,
    { provider, paymentRef, ts: now(), id: orderId }
  );
  const items = getOrderItems(orderId);
  for (const item of items) {
    if (item.product_id) decrementStock(item.product_id, item.quantity);
  }
  clearCart(order.user_id);
  return getOrderById(orderId)!;
}

export function markOrderFailed(orderId: string, provider: string, paymentRef: string | null) {
  const order = getOrderById(orderId);
  if (!order) throw new HttpError(404, "Order not found.");
  if (order.status === "paid") return order;
  run(
    `UPDATE orders SET status = 'failed', payment_provider = @provider, payment_ref = @paymentRef, updated_at = @ts WHERE id = @id`,
    { provider, paymentRef, ts: now(), id: orderId }
  );
  return getOrderById(orderId)!;
}
