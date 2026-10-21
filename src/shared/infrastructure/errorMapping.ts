import { AppError, type ApiErrorCode } from "../kernel/AppError";

export { AppError, type ApiErrorCode };

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

export function toErrorBody(err: unknown): { status: number; body: ApiErrorBody } {
  if (err instanceof AppError) {
    const error: ApiErrorBody["error"] = { code: err.code, message: err.message };
    if (err.details !== undefined) error.details = err.details;
    return { status: err.status, body: { error } };
  }
  return {
    status: 500,
    body: { error: { code: "internal_error", message: "Something went wrong" } },
  };
}

interface WooErrorBody {
  code?: unknown;
  message?: unknown;
  data?: { status?: unknown };
}

/**
 * Maps a failed Woo response to an AppError. Auth failures and 5xx are hidden
 * behind generic upstream errors; other 4xx keep Woo's machine-readable code
 * (e.g. woocommerce_rest_product_partially_out_of_stock).
 */
export function mapWooError(status: number, payload: unknown): AppError {
  const body = (payload && typeof payload === "object" ? payload : {}) as WooErrorBody;
  const wooCode = typeof body.code === "string" ? body.code : undefined;
  const wooMessage = typeof body.message === "string" ? body.message : undefined;

  if (status === 404) return new AppError("not_found", "Not found", 404);
  if (status === 429) return new AppError("rate_limited", "Too many requests", 429);
  if (status === 401 || status === 403 || status >= 500) {
    return new AppError("upstream_error", "Upstream service error", 502);
  }
  if (status >= 400) {
    const code = wooCode ?? (status === 409 ? "conflict" : "validation_error");
    return new AppError(code, wooMessage ?? "Request rejected", status);
  }
  return new AppError("upstream_error", "Unexpected upstream response", 502);
}
