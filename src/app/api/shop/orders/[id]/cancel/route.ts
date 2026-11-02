import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute } from "@/shared/infrastructure/bff";
import { cancelOrder, isOrderNumber } from "@/modules/orders/index.server";
import { verifiedCaller } from "../../../cart/cartRoute";

type Ctx = { params: { id: string } };

// The signed-in customer cancels one of their orders (O2). The id is verified
// with WordPress: the order is changed with the server keys. 409 when the
// order can no longer be cancelled.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute<Ctx>({
  POST: async (req, ctx) => {
    if (!isOrderNumber(ctx.params.id)) throw new AppError("not_found", "Not found", 404);
    const { customerId } = await verifiedCaller(req);
    const order = await cancelOrder(ctx.params.id, customerId);
    return NextResponse.json({ order }, { headers: { "Cache-Control": "private, no-store" } });
  },
});
