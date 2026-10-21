export type ApiErrorCode =
  | "validation_error"
  | "not_found"
  | "method_not_allowed"
  | "rate_limited"
  | "conflict"
  | "upstream_error"
  | "upstream_timeout"
  | "internal_error"
  | "invalid_money"
  | (string & {});

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}
