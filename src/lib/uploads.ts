import fs from "node:fs";
import path from "node:path";
import { HttpError } from "./http";
import { randomToken } from "./ids";

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB decoded

const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

/**
 * Accepts a data: URL (e.g. "data:image/png;base64,AAAA...") as produced by
 * the browser's FileReader, validates it, and writes it to /public/uploads.
 * Returns the public URL path to store on the product.
 */
export function saveBase64Image(dataUrl: string): string {
  const match = /^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) {
    throw new HttpError(400, "Invalid image data.");
  }
  const [, mime, base64] = match;
  const ext = ALLOWED_MIME[mime.toLowerCase()];
  if (!ext) {
    throw new HttpError(400, "Unsupported image type. Please upload PNG, JPEG, WEBP, or GIF.");
  }
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    throw new HttpError(400, "Empty image data.");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new HttpError(413, "Image is too large (max 4MB).");
  }
  const filename = `${Date.now()}-${randomToken(8)}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

export function deleteUploadedImage(url: string) {
  if (!url.startsWith("/uploads/")) return;
  const filePath = path.join(uploadsDir, path.basename(url));
  fs.rm(filePath, { force: true }, () => {});
}
