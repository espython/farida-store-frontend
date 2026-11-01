// Public API of the wishlist context (client-safe). Server code is in ./index.server.
export type { Wishlist } from "./domain/Wishlist";
export { MAX_WISHLIST } from "./domain/Wishlist";

// Application: use case, store wiring.
export { useWishlist } from "./application/useWishlist";
export type { WishlistChange } from "./application/useWishlist";
export { wishlistApi } from "./application/wishlistApi";
export { WISHLIST_KEY, initialWishlistState, wishlistActions, wishlistReducer } from "./application/wishlistSlice";
export type { WishlistState } from "./application/wishlistSlice";
export { startWishlistPersistence } from "./application/wishlistPersistence";

// UI: the heart is injected into catalog cards and the product page by the page.
export { default as WishlistButton } from "./ui/WishlistButton";
export { default as WishlistView } from "./ui/WishlistView";
export { default as WishlistSync } from "./ui/WishlistSync";
