import { z } from "zod";
import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson, parseQuery } from "@/shared/infrastructure/bff";
import { listReviews, MAX_REVIEW_LENGTH, postReview, validateReviewDraft } from "@/modules/reviews/index.server";
import { verifiedCaller } from "../cart/cartRoute";
import { productIdParam, reviewResponse } from "./reviewsRoute";

const listQuery = z.object({
  productId: productIdParam,
  page: z.coerce.number().int().min(1).max(100).default(1),
});

const body = z.object({
  productId: productIdParam,
  rating: z.number(),
  // Generous here; the domain rule (validateReviewDraft) gives the precise error.
  text: z.string().max(MAX_REVIEW_LENGTH * 2),
});

// GET: a product's approved reviews (public). POST: the signed-in customer's
// review, held until the shop approves it in Woo.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const { productId, page } = parseQuery(req, listQuery);
    return NextResponse.json(await listReviews(productId, page));
  },
  POST: async (req) => {
    const input = await parseJson(req, body);
    const draft = validateReviewDraft(input);
    if (!draft.ok) throw new AppError("invalid_review", "Check your review", 400, draft.errors);
    const { customerId } = await verifiedCaller(req);
    return reviewResponse({ review: await postReview(customerId, input.productId, draft.draft) }, 201);
  },
});
