import { z } from "zod";
import { defineRoute, parseJson } from "@/shared/infrastructure/bff";
import { MAX_WISHLIST, mergeIntoWishlist } from "@/modules/wishlist/index.server";
import { verifiedCaller } from "../../cart/cartRoute";
import { wishlistResponse } from "../wishlistRoute";

const body = z.object({ productIds: z.array(z.string().regex(/^[1-9]\d{0,9}$/)).max(MAX_WISHLIST) });

// After sign-in: the guest's browser list joins the saved one.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  POST: async (req) => {
    const { productIds } = await parseJson(req, body);
    const { customerId } = await verifiedCaller(req);
    const { wishlist, skipped } = await mergeIntoWishlist(customerId, productIds);
    return wishlistResponse({ wishlist, skipped });
  },
});
