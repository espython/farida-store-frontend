import { AppError, mapWooError } from "./errorMapping";
import {
  isWooRouteAllowed,
  WOO_ALLOWLIST,
  type AllowedWooRoute,
} from "./wooAllowlist";

const DEFAULT_TIMEOUT_MS = 8000;

type Query = Record<string, string | number | boolean | undefined>;

export interface WooRequest {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Path under /wp-json, e.g. /wc/store/v1/products */
  path: string;
  query?: Query;
  body?: unknown;
  headers?: Record<string, string>;
  /** "keys" sends the consumer key (admin-level). Never cached. */
  auth?: "keys" | "none";
  timeoutMs?: number;
  /** Next fetch cache hints; ignored when auth is "keys". */
  next?: { revalidate?: number | false; tags?: string[] };
  allowlist?: readonly AllowedWooRoute[];
  /**
   * Translate an expected failure before the generic mapping, which hides
   * every 401/403 as an upstream error. Return undefined to fall through.
   * Used by auth, where 403 means "wrong password", not "backend broken".
   */
  mapError?: (status: number, payload: unknown) => AppError | undefined;
}

export interface WooResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

function getConfig() {
  const baseUrl = process.env.WC_BASE_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!baseUrl) throw new AppError("internal_error", "Shop backend is not configured", 500);
  return { baseUrl: baseUrl.replace(/\/+$/, ""), key, secret };
}

function buildUrl(baseUrl: string, path: string, query?: Query): string {
  const url = new URL(`${baseUrl}/wp-json${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function wooFetch<T = unknown>(req: WooRequest): Promise<WooResponse<T>> {
  const method = req.method ?? "GET";
  const auth = req.auth ?? "none";

  if (!req.path.startsWith("/") || req.path.includes("..")) {
    throw new AppError("internal_error", "Invalid upstream path", 500);
  }
  if (!isWooRouteAllowed(method, req.path, req.allowlist ?? WOO_ALLOWLIST)) {
    throw new AppError("internal_error", "Upstream route is not allowed", 500);
  }

  const { baseUrl, key, secret } = getConfig();
  const headers: Record<string, string> = { Accept: "application/json", ...req.headers };
  if (auth === "keys") {
    if (!key || !secret) {
      throw new AppError("internal_error", "Shop backend is not configured", 500);
    }
    headers.Authorization = `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
  }
  if (req.body !== undefined) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const started = Date.now();

  let res: Response;
  try {
    res = await fetch(buildUrl(baseUrl, req.path, req.query), {
      method,
      headers,
      body: req.body === undefined ? undefined : JSON.stringify(req.body),
      signal: controller.signal,
      ...(auth === "keys" ? { cache: "no-store" as const } : { next: req.next }),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    console.error(`[woo] ${method} ${req.path} ${timedOut ? "timeout" : "network error"}`);
    throw timedOut
      ? new AppError("upstream_timeout", "Upstream service timed out", 504)
      : new AppError("upstream_error", "Upstream service unreachable", 502);
  } finally {
    clearTimeout(timer);
  }

  console.info(`[woo] ${method} ${req.path} ${res.status} ${Date.now() - started}ms`);

  const text = await res.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = undefined;
  }

  if (!res.ok) throw req.mapError?.(res.status, payload) ?? mapWooError(res.status, payload);
  return { data: payload as T, status: res.status, headers: res.headers };
}
