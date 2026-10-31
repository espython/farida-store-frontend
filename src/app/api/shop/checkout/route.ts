import { defineRoute } from "@/shared/infrastructure/bff";
import { getCheckout } from "@/modules/checkout/index.server";
import { cartCaller } from "../cart/cartRoute";
import { checkoutResponse } from "./checkoutRoute";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const caller = cartCaller(req);
    return checkoutResponse(caller.customerId, await getCheckout(caller));
  },
});
