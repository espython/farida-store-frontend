import { z } from "zod";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { applyCoupon, removeCoupon } from "@/modules/checkout/index.server";
import { MAX_COUPON_CODE_LENGTH, normaliseCouponCode } from "@/modules/cart/index.server";
import { cartCaller } from "../../cart/cartRoute";
import { checkoutResponse } from "../checkoutRoute";

const body = z.object({ code: z.string().max(MAX_COUPON_CODE_LENGTH + 10) });

// Woo stores coupon codes lower-case; the shared rule trims and validates them.
const codeOf = (raw: string) => {
  const code = normaliseCouponCode(raw);
  if (!code) throw new AppError("coupon_invalid", "Coupon cannot be used", 400);
  return code.toLowerCase();
};

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    const caller = cartCaller(req);
    const { code } = await parseJson(req, body);
    return checkoutResponse(caller.customerId, await applyCoupon(caller, codeOf(code)));
  },
  DELETE: async (req) => {
    const caller = cartCaller(req);
    const { code } = await parseJson(req, body);
    return checkoutResponse(caller.customerId, await removeCoupon(caller, codeOf(code)));
  },
});
