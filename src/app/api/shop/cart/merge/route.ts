import { z } from "zod";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { MAX_CART_LINES, MAX_LINE_QUANTITY, mergeLines } from "@/modules/cart/index.server";
import { cartCaller, cartResponse } from "../cartRoute";

// The guest cart's lines, merged into the customer's saved cart after sign-in.
const body = z.object({
  lines: z
    .array(z.object({ productId: z.string().regex(/^\d+$/), quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY) }))
    .max(MAX_CART_LINES),
});

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    const caller = cartCaller(req);
    const { lines } = await parseJson(req, body);
    const result = await mergeLines(caller, lines);
    return cartResponse(caller.customerId, result, { skipped: result.skipped });
  },
});
