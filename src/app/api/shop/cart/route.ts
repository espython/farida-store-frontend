import { defineRoute } from "@/shared/infrastructure/bff";
import { clearCart, getCart } from "@/modules/cart/index.server";
import { cartCaller, cartResponse } from "./cartRoute";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const caller = cartCaller(req);
    return cartResponse(caller.customerId, await getCart(caller));
  },
  DELETE: async (req) => {
    const caller = cartCaller(req);
    return cartResponse(caller.customerId, await clearCart(caller));
  },
});
