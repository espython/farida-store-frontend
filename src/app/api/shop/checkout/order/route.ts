import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { setCartToken } from "@/modules/cart/index.server";
import { isIdempotencyKey, placeOnce, placeOrder } from "@/modules/checkout/index.server";
import { cartCaller } from "../../cart/cartRoute";

const body = z.object({
  paymentMethod: z.enum(["cod", "card"]),
  note: z.string().max(500).default(""),
});

/**
 * Place the order. The Idempotency-Key header is required: the same key from
 * the same customer gets the same order back (double click, retry), and
 * concurrent attempts are serialized (the Store API would create two orders).
 */
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    const caller = cartCaller(req);
    const key = req.headers.get("idempotency-key");
    if (!isIdempotencyKey(key)) throw new AppError("validation_error", "Idempotency-Key header required", 400);
    const input = await parseJson(req, body);
    // Card payment comes with Paymob (C3b); until then only COD is placed here.
    if (input.paymentMethod !== "cod") throw new AppError("payment_unavailable", "This payment method is not available", 400);
    const placed = await placeOnce(caller.customerId, key, () => placeOrder(caller, input));
    const res = NextResponse.json({ orderId: placed.orderId, status: placed.status }, { headers: { "Cache-Control": "private, no-store" } });
    setCartToken(res, caller.customerId, placed.cartToken);
    return res;
  },
});
