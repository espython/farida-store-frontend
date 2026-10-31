import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute } from "@/shared/infrastructure/bff";
import { getOrder } from "@/modules/checkout/index.server";
import { cartCaller } from "../../cart/cartRoute";

type Ctx = { params: { id: string } };

// One of the signed-in customer's orders; anyone else's is a 404.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute<Ctx>({
  GET: async (req, ctx) => {
    const { customerId } = cartCaller(req);
    if (!/^\d{1,12}$/.test(ctx.params.id)) throw new AppError("not_found", "Not found", 404);
    const order = await getOrder(ctx.params.id, customerId);
    return NextResponse.json({ order }, { headers: { "Cache-Control": "private, no-store" } });
  },
});
