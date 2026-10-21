import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { AppError, toErrorBody } from "./errorMapping";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = (typeof METHODS)[number];

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response> | Response;

const MAX_BODY_BYTES = 100_000;

export function errorResponse(err: unknown, extraHeaders?: HeadersInit): NextResponse {
  const { status, body } = toErrorBody(err instanceof ZodError ? validationError(err) : err);
  if (status >= 500) console.error("[bff]", err);
  return NextResponse.json(body, { status, headers: extraHeaders });
}

/**
 * Wraps route handlers so that only the listed methods are served, everything
 * else gets a JSON 405 with an Allow header, and thrown errors use the shared
 * error shape. Usage: export const { GET, POST } = defineRoute({ GET: ... })
 */
export function defineRoute<C = unknown>(
  handlers: Partial<Record<Method, Handler<C>>>
): Record<Method, (req: NextRequest, ctx: C) => Promise<Response>> {
  const allow = METHODS.filter((m) => handlers[m]).join(", ");
  const out = {} as Record<Method, (req: NextRequest, ctx: C) => Promise<Response>>;
  for (const m of METHODS) {
    const handler = handlers[m];
    out[m] = async (req, ctx) => {
      if (!handler) {
        return errorResponse(
          new AppError("method_not_allowed", "Method not allowed", 405),
          { Allow: allow }
        );
      }
      try {
        return await handler(req, ctx);
      } catch (err) {
        return errorResponse(err);
      }
    };
  }
  return out;
}

function validationError(error: z.ZodError): AppError {
  return new AppError(
    "validation_error",
    "Invalid request",
    400,
    error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
  );
}

export function parseQuery<S extends ZodTypeAny>(req: NextRequest, schema: S): z.infer<S> {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export async function parseJson<S extends ZodTypeAny>(
  req: NextRequest,
  schema: S
): Promise<z.infer<S>> {
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new AppError("validation_error", "Request body too large", 413);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new AppError("validation_error", "Body must be valid JSON", 400);
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw validationError(result.error);
  return result.data;
}
