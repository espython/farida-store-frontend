// Public API of the content context (client-safe). Server code is in ./index.server.
export type { PromoLink, PromoPlacement, Promotion, Promotions } from "./domain/Promotion";

// Application: store wiring and use cases.
export { contentApi } from "./application/contentApi";
export { CONTENT_KEY, contentActions, contentReducer, initialContentState } from "./application/contentSlice";
export type { ContentState } from "./application/contentSlice";
export { useAnnouncementBar, usePromotions } from "./application/usePromotions";

// UI.
export { default as AnnouncementBar } from "./ui/AnnouncementBar";
export { default as HeroBanners } from "./ui/HeroBanners";
export { default as MiniPromos } from "./ui/MiniPromos";
