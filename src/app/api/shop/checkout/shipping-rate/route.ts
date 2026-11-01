import { z } from "zod";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { selectShippingRate } from "@/modules/checkout/index.server";
import { cartCaller } from "../../cart/cartRoute";
import { checkoutResponse } from "../checkoutRoute";

const body = z.object({ rateId: z.string().min(1).max(100) });

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  PUT: async (req) => {
    const caller = cartCaller(req);
    const { rateId } = await parseJson(req, body);
    return checkoutResponse(caller.customerId, await selectShippingRate(caller, rateId));
  },
});
