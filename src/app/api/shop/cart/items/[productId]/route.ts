import { z } from "zod";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { AppError } from "@/shared/kernel/AppError";
import { MAX_LINE_QUANTITY, removeItem, setQuantity } from "@/modules/cart/index.server";
import { cartCaller, cartResponse } from "../../cartRoute";

type Ctx = { params: { productId: string } };

const body = z.object({ quantity: z.number().int().min(0).max(MAX_LINE_QUANTITY) });

const productIdOf = (ctx: Ctx) => {
  if (!/^\d+$/.test(ctx.params.productId)) throw new AppError("validation_error", "Invalid product id", 400);
  return ctx.params.productId;
};

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute<Ctx>({
  PATCH: async (req, ctx) => {
    const caller = cartCaller(req);
    const { quantity } = await parseJson(req, body);
    return cartResponse(caller.customerId, await setQuantity(caller, productIdOf(ctx), quantity));
  },
  DELETE: async (req, ctx) => {
    const caller = cartCaller(req);
    return cartResponse(caller.customerId, await removeItem(caller, productIdOf(ctx)));
  },
});
