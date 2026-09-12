import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  HttpError,
  parseCookies,
  readJsonBody,
  sendHtml,
  sendJson,
  sendRedirect,
} from "./http";
import type { SessionContext } from "./auth";
import { getSessionFromCookies } from "./auth";

export interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  method: string;
  params: Record<string, string>;
  query: URLSearchParams;
  cookies: Record<string, string>;
  session: SessionContext | null;
  locale: "ar" | "en";
  theme: "light-blue" | "dark-blue";
  pendingCookies: string[];
  jsonBody<T = any>(): Promise<T>;
  json(status: number, data: unknown): void;
  html(status: number, body: string): void;
  redirect(location: string, status?: number): void;
  setCookie(cookie: string): void;
  isJsonRequest(): boolean;
}

type Handler = (ctx: Ctx) => Promise<void> | void;

interface Route {
  method: string;
  segments: string[];
  handler: Handler;
}

function splitPath(p: string): string[] {
  return p.split("/").filter(Boolean);
}

export class Router {
  private routes: Route[] = [];

  add(method: string, pattern: string, handler: Handler) {
    this.routes.push({ method, segments: splitPath(pattern), handler });
  }

  get(pattern: string, handler: Handler) {
    this.add("GET", pattern, handler);
  }
  post(pattern: string, handler: Handler) {
    this.add("POST", pattern, handler);
  }
  put(pattern: string, handler: Handler) {
    this.add("PUT", pattern, handler);
  }
  delete(pattern: string, handler: Handler) {
    this.add("DELETE", pattern, handler);
  }

  private match(method: string, pathname: string): { handler: Handler; params: Record<string, string> } | null {
    const actual = splitPath(pathname);
    for (const route of this.routes) {
      if (route.method !== method) continue;
      if (route.segments.length !== actual.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < route.segments.length; i++) {
        const seg = route.segments[i];
        if (seg.startsWith(":")) {
          params[seg.slice(1)] = decodeURIComponent(actual[i]);
        } else if (seg !== actual[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return { handler: route.handler, params };
    }
    return null;
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url || "/", "http://internal.local");
    const method = (req.method || "GET").toUpperCase();
    const cookies = parseCookies(req);
    const session = await getSessionFromCookies(cookies);

    const localeCookie = cookies["locale"];
    const locale: "ar" | "en" = localeCookie === "en" ? "en" : session?.user.locale === "en" ? "en" : "ar";
    const themeCookie = cookies["theme"];
    const theme: "light-blue" | "dark-blue" =
      themeCookie === "dark-blue"
        ? "dark-blue"
        : session?.user.theme === "dark-blue"
        ? "dark-blue"
        : "light-blue";

    const pendingCookies: string[] = [];

    const ctx: Ctx = {
      req,
      res,
      url,
      method,
      params: {},
      query: url.searchParams,
      cookies,
      session,
      locale,
      theme,
      pendingCookies,
      jsonBody: () => readJsonBody(req),
      json(status, data) {
        flushCookies();
        sendJson(res, status, data);
      },
      html(status, body) {
        flushCookies();
        sendHtml(res, status, body);
      },
      redirect(location, status = 302) {
        flushCookies();
        sendRedirect(res, location, status);
      },
      setCookie(cookie: string) {
        pendingCookies.push(cookie);
      },
      isJsonRequest() {
        // Route-based first: every /api/* and /webhooks/* endpoint always
        // replies with JSON errors regardless of what the caller sends, so
        // a bare `fetch('/api/...')` never gets an HTML error page it can't
        // parse. Fall back to header sniffing for anything else.
        if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/webhooks/")) return true;
        const accept = req.headers.accept || "";
        const contentType = req.headers["content-type"] || "";
        return accept.includes("application/json") || contentType.includes("application/json");
      },
    };

    function flushCookies() {
      if (pendingCookies.length > 0) {
        res.setHeader("Set-Cookie", pendingCookies);
      }
    }

    const match = this.match(method, url.pathname);
    if (!match) {
      flushCookies();
      sendHtml(res, 404, "<h1>404 Not Found</h1>");
      return;
    }
    ctx.params = match.params;

    try {
      await match.handler(ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        if (ctx.isJsonRequest()) {
          ctx.json(err.status, { error: err.message });
        } else {
          flushCookies();
          sendHtml(res, err.status, `<h1>${err.status}</h1><p>${escapeHtml(err.message)}</p>`);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error("Unhandled error:", err);
        if (ctx.isJsonRequest()) {
          ctx.json(500, { error: "Internal server error." });
        } else {
          flushCookies();
          sendHtml(res, 500, "<h1>500</h1><p>Something went wrong.</p>");
        }
      }
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
