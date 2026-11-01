import { AppError } from "@/shared/kernel/AppError";
import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import { serializedPerKey } from "@/shared/infrastructure/perKeyQueue.server";
import { REVIEWS_PER_PAGE, reviewerName, type MyReview, type ReviewDraft, type ReviewPage } from "../domain/Review";
import { toMyReview, toReview } from "./reviewMapper";
import type { StoreReviewDto, WcReviewDto } from "./wooReviewDto";

/** Fetch-cache tag on the public review lists. */
export const REVIEWS_CACHE_TAG = "reviews";

const intHeader = (headers: Headers, name: string, fallback: number) => {
  const n = Number.parseInt(headers.get(name) ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Approved reviews of a product, newest first (public, cached for a minute). */
export async function listReviews(productId: string, page = 1, perPage = REVIEWS_PER_PAGE): Promise<ReviewPage> {
  const res = await wooFetch<StoreReviewDto[]>({
    path: "/wc/store/v1/products/reviews",
    query: { product_id: productId, page, per_page: perPage, orderby: "date_gmt", order: "desc" },
    // Pages past the end, and unknown products, are an empty list.
    next: { revalidate: 60, tags: [REVIEWS_CACHE_TAG] },
  });
  const items = (Array.isArray(res.data) ? res.data : []).map(toReview);
  return {
    items,
    page,
    total: intHeader(res.headers, "x-wp-total", items.length),
    totalPages: Math.max(1, intHeader(res.headers, "x-wp-totalpages", 1)),
  };
}

interface WcCustomer {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
}

// Read and written with the server keys, so the id must be one WordPress
// verified (verifiedCaller in app/api); it is the only id used.
async function customer(customerId: string) {
  if (!/^[1-9]\d*$/.test(customerId)) throw new AppError("unauthenticated", "Sign in to write a review", 401);
  const { data } = await wooFetch<WcCustomer>({
    path: `/wc/v3/customers/${customerId}`,
    auth: "keys",
    query: { _fields: "id,email,first_name,last_name" },
  });
  if (!data.email) throw new AppError("unauthenticated", "Sign in to write a review", 401);
  return { email: data.email, name: reviewerName(data.first_name ?? "", data.last_name ?? "") };
}

/** The customer's own review (held or approved), found by their email. */
async function findOwn(email: string, productId: string): Promise<MyReview | null> {
  const { data } = await wooFetch<WcReviewDto[]>({
    path: "/wc/v3/products/reviews",
    auth: "keys",
    // status=all: held and approved (the default is approved only).
    query: { product: productId, reviewer_email: email, status: "all", per_page: 1 },
  });
  const own = Array.isArray(data) ? data.find((r) => String(r.product_id) === productId) : undefined;
  return own ? toMyReview(own) : null;
}

/** A product the shop sells (and shows): reviewing anything else is a 404. */
async function requireProduct(productId: string) {
  await wooFetch({
    path: `/wc/store/v1/products/${productId}`,
    query: { _fields: "id" },
    next: { revalidate: 300, tags: ["catalog"] },
    mapError: (status) => (status === 404 ? new AppError("not_found", "No such product", 404) : undefined),
  });
}

export async function getMyReview(customerId: string, productId: string): Promise<MyReview | null> {
  const { email } = await customer(customerId);
  return findOwn(email, productId);
}

const alreadyReviewed = () => new AppError("already_reviewed", "You have already reviewed this product", 409);

/**
 * Post a review for the shop to approve: it is held, and appears (and counts in
 * the product's rating) once approved in Woo. One per customer and product.
 */
export async function postReview(customerId: string, productId: string, draft: ReviewDraft): Promise<MyReview> {
  const me = await customer(customerId);
  await requireProduct(productId);
  return serializedPerKey(`review:${customerId}:${productId}`, async () => {
    if (await findOwn(me.email, productId)) throw alreadyReviewed();
    const { data } = await wooFetch<WcReviewDto>({
      method: "POST",
      path: "/wc/v3/products/reviews",
      auth: "keys",
      body: {
        product_id: Number(productId),
        // Shown publicly: never any part of the email.
        reviewer: me.name ?? "Customer",
        reviewer_email: me.email,
        rating: draft.rating,
        review: draft.text,
        status: "hold",
      },
      // WordPress refuses the same text twice from one author.
      mapError: (status, payload) =>
        status === 409 || (payload as { code?: string } | undefined)?.code === "woocommerce_rest_comment_duplicate"
          ? alreadyReviewed()
          : undefined,
    });
    return toMyReview(data);
  });
}
