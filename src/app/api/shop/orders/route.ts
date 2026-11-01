import { NextResponse } from "next/server";
import { defineRoute } from "@/shared/infrastructure/bff";
import { listOrders } from "@/modules/orders/index.server";
import { verifiedCaller } from "../cart/cartRoute";

const MAX_PAGE = 1000;

// The signed-in customer's orders, newest first. The id is verified with
// WordPress: orders are read with the server keys.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const raw = Number.parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), MAX_PAGE) : 1;
    const { customerId } = await verifiedCaller(req);
    const orders = await listOrders(customerId, page);
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "private, no-store" } });
  },
});
