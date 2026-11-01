"use client";
import { AddToCartButton, toProductRef } from "@/modules/cart";
import { WishlistView } from "@/modules/wishlist";

/** The page composes wishlist and cart: neither module imports the other. */
const WishlistPageContent = () => <WishlistView renderActions={(p) => <AddToCartButton product={toProductRef(p)} />} />;

export default WishlistPageContent;
