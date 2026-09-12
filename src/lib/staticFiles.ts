import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const publicDir = path.resolve(process.cwd(), "public");

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
};

const STATIC_PREFIXES = ["/css/", "/js/", "/images/", "/uploads/", "/favicon.ico"];

export function isStaticPath(pathname: string): boolean {
  return STATIC_PREFIXES.some((p) => pathname.startsWith(p) || pathname === p);
}

export function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): boolean {
  const relative = pathname.replace(/^\/+/, "");
  const resolved = path.resolve(publicDir, relative);
  // Prevent path traversal outside of /public.
  if (!resolved.startsWith(publicDir)) {
    res.writeHead(403).end("Forbidden");
    return true;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return false;
  }
  const ext = path.extname(resolved).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  const isUpload = pathname.startsWith("/uploads/");
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": isUpload ? "public, max-age=31536000, immutable" : "public, max-age=3600",
  });
  fs.createReadStream(resolved).pipe(res);
  return true;
}
