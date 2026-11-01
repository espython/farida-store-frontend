import { defineRoute } from "@/shared/infrastructure/bff";
import { getWishlist } from "@/modules/wishlist/index.server";
import { verifiedCaller } from "../cart/cartRoute";
import { wishlistResponse } from "./wishlistRoute";

// The signed-in customer's saved wishlist (customer meta, server keys, verified id).
// Guests keep theirs in the browser.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const { customerId } = await verifiedCaller(req);
    return wishlistResponse({ wishlist: await getWishlist(customerId) });
  },
});
