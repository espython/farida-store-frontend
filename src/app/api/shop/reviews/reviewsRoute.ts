import { z } from "zod";
import { NextResponse } from "next/server";
import { isProductId } from "@/modules/reviews/index.server";

export const productIdParam = z.string().refine(isProductId, "Invalid product id");

/** The customer's own review: never cached anywhere. */
export const reviewResponse = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
