import { NextResponse } from "next/server";
import { AppError } from "@/shared/kernel/AppError";
import { defineRoute } from "@/shared/infrastructure/bff";
import { getOrder } from "@/modules/checkout/index.server";
import { verifiedCaller } from "../../cart/cartRoute";

type Ctx = { params: { id: string } };

// One of the signed-in customer's orders; anyone else's is a 404. The id is
// verified with WordPress: the order is read with the server keys.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute<Ctx>({
  GET: async (req, ctx) => {
    const { customerId } = await verifiedCaller(req);
    if (!/^\d{1,12}$/.test(ctx.params.id)) throw new AppError("not_found", "Not found", 404);
    const order = await getOrder(ctx.params.id, customerId);
    return NextResponse.json({ order }, { headers: { "Cache-Control": "private, no-store" } });
  },
});
