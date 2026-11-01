import { describe, expect, it } from "vitest";
import { cleanReviewText, isProductId, MAX_REVIEW_LENGTH, reviewerName, validateReviewDraft } from "./Review";

describe("validateReviewDraft", () => {
  it("accepts whole stars 1–5 and 10+ characters, cleaned", () => {
    expect(validateReviewDraft({ rating: 5, text: "  Great kettle!  \r\n\r\n\r\n\r\nBoils fast.  " })).toEqual({
      ok: true,
      draft: { rating: 5, text: "Great kettle!\n\nBoils fast." },
    });
  });

  it("refuses ratings Woo would store anyway", () => {
    for (const rating of [0, 6, 9, 2.5, "5", null]) {
      expect(validateReviewDraft({ rating, text: "Long enough text" })).toEqual({ ok: false, errors: { rating: "rating_required" } });
    }
  });

  it("counts characters, not UTF-16 units, so Arabic and emoji are fair", () => {
    expect(validateReviewDraft({ rating: 4, text: "ممتاز جدًا!" }).ok).toBe(true);
    expect(validateReviewDraft({ rating: 4, text: "👍👍👍👍👍" })).toEqual({ ok: false, errors: { text: "text_too_short" } });
    expect(validateReviewDraft({ rating: 4, text: "a".repeat(MAX_REVIEW_LENGTH + 1) })).toEqual({ ok: false, errors: { text: "text_too_long" } });
    expect(validateReviewDraft({ rating: 0, text: "   " })).toEqual({ ok: false, errors: { rating: "rating_required", text: "text_too_short" } });
  });

  it("cleans text without touching single line breaks", () => {
    expect(cleanReviewText("a  \nb")).toBe("a\nb");
  });
});

describe("reviewerName", () => {
  it("shows the first name and last initial only", () => {
    expect(reviewerName("Nour", "wahba")).toBe("Nour W.");
    expect(reviewerName(" نور ", "وهبة")).toBe("نور و.");
    expect(reviewerName("Nour", "")).toBe("Nour");
    expect(reviewerName("", "Wahba")).toBeNull();
  });
});

it("isProductId", () => {
  expect(["1", "296"].every(isProductId)).toBe(true);
  expect(["0", "01", "1a", "", "12345678901"].some(isProductId)).toBe(false);
});
