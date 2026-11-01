import { describe, expect, it } from "vitest";
import { toMyReview, toReview } from "./reviewMapper";

describe("reviewMapper", () => {
  it("maps a Store API review to plain text with a UTC date", () => {
    expect(
      toReview({
        id: 471,
        product_id: 296,
        date_created_gmt: "2026-11-01T21:46:55",
        reviewer: "Nour W.",
        review: "<p>Great &amp; fast <b>kettle</b> x</p>\n",
        rating: 5,
        verified: true,
      })
    ).toEqual({ id: "471", productId: "296", reviewer: "Nour W.", rating: 5, text: "Great & fast kettle x", verified: true, createdAt: "2026-11-01T21:46:55.000Z" });
  });

  it("keeps ratings in 1–5 and defaults missing fields", () => {
    const r = toReview({ id: 1, product_id: 2, rating: 9 });
    expect(r).toMatchObject({ rating: 5, text: "", verified: false, reviewer: "—", createdAt: "1970-01-01T00:00:00.000Z" });
    expect(toReview({ id: 1, product_id: 2, rating: 0 }).rating).toBe(1);
  });

  it("maps the customer's own review status", () => {
    expect(toMyReview({ id: 1, product_id: 2, status: "hold" }).status).toBe("pending");
    expect(toMyReview({ id: 1, product_id: 2, status: "approved" }).status).toBe("approved");
  });
});
