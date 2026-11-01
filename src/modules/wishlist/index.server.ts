// Server entry of the wishlist context. Import only from app/api and server components.
export { addToWishlist, getWishlist, mergeIntoWishlist, removeFromWishlist } from "./infrastructure/wishlistClient.server";
export { isProductId, MAX_WISHLIST } from "./domain/Wishlist";
