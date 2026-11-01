import { z } from "zod";
import { defineRoute, parseQuery } from "@/shared/infrastructure/bff";
import { getMyReview } from "@/modules/reviews/index.server";
import { verifiedCaller } from "../../cart/cartRoute";
import { productIdParam, reviewResponse } from "../reviewsRoute";

const query = z.object({ productId: productIdParam });

// The signed-in customer's own review of a product, held or approved (or null).
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const { productId } = parseQuery(req, query);
    const { customerId } = await verifiedCaller(req);
    return reviewResponse({ review: await getMyReview(customerId, productId) });
  },
});
