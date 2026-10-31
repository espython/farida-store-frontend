import { z } from "zod";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { addItem, MAX_LINE_QUANTITY } from "@/modules/cart/index.server";
import { cartCaller, cartResponse } from "../cartRoute";

const body = z.object({
  productId: z.string().regex(/^\d+$/),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    const caller = cartCaller(req);
    const { productId, quantity } = await parseJson(req, body);
    return cartResponse(caller.customerId, await addItem(caller, productId, quantity));
  },
});
