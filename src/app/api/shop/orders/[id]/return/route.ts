import { z } from "zod";
import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { isOrderNumber, MAX_RETURN_DETAILS_LENGTH, requestReturn, validateReturnRequest } from "@/modules/orders/index.server";
import { verifiedCaller } from "../../../cart/cartRoute";

type Ctx = { params: { id: string } };

const body = z.object({
  reason: z.string().max(40),
  // Generous here; the domain rule (validateReturnRequest) gives the precise error.
  details: z.string().max(MAX_RETURN_DETAILS_LENGTH * 2).default(""),
});

// The signed-in customer asks to return a delivered order (O2): the order
// becomes "Return requested" with the reason in a private note for the shop.
// 409 when the order is not delivered or the return window has passed.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute<Ctx>({
  POST: async (req, ctx) => {
    if (!isOrderNumber(ctx.params.id)) throw new AppError("not_found", "Not found", 404);
    const input = await parseJson(req, body);
    const result = validateReturnRequest(input);
    if (!result.ok) throw new AppError("invalid_return", "Check your return request", 400, result.errors);
    const { customerId } = await verifiedCaller(req);
    const order = await requestReturn(ctx.params.id, customerId, result.request);
    return NextResponse.json({ order }, { headers: { "Cache-Control": "private, no-store" } });
  },
});
