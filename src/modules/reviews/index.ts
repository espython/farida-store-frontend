// Public API of the reviews context (client-safe). Server code is in ./index.server.
export type { MyReview, Review, ReviewDraftErrors, ReviewPage, ReviewStatus } from "./domain/Review";
export { MAX_REVIEW_LENGTH, MIN_REVIEW_LENGTH } from "./domain/Review";

// Application: use cases.
export { reviewsApi } from "./application/reviewsApi";
export { useMyReview, useProductReviews } from "./application/useReviews";
export type { ReviewSubmitResult } from "./application/useReviews";

// UI: the product page composes the section.
export { default as ProductReviews } from "./ui/ProductReviews";
