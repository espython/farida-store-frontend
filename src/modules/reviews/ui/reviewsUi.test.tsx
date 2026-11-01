import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import type { MyReview, Review } from "../domain/Review";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("react-toastify", () => ({ toast }));
vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const hooks = vi.hoisted(() => ({ list: vi.fn(), mine: vi.fn() }));
vi.mock("../application/useReviews", () => ({ useProductReviews: hooks.list, useMyReview: hooks.mine }));

import ProductReviews from "./ProductReviews";

const review = (id: string, over: Partial<Review> = {}): Review => ({
  id, productId: "296", reviewer: "Ali M.", rating: 4, text: `Review ${id}`, verified: false, createdAt: "2026-11-01T10:00:00.000Z", ...over,
});
const list = (over = {}) => ({ reviews: [], total: 0, isLoading: false, isError: false, hasMore: false, loadingMore: false, loadMore: vi.fn(), retry: vi.fn(), ...over });
const mine = (over = {}) => ({ status: "signedIn", review: null, submit: vi.fn(), submitting: false, ...over });

const wrap = (ui: ReactNode, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      {ui}
    </NextIntlClientProvider>
  );

beforeEach(() => {
  toast.success.mockReset();
  hooks.list.mockReset();
  hooks.mine.mockReset();
});

describe("ProductReviews", () => {
  it("shows the summary and published reviews with the verified-buyer badge, and loads more", () => {
    const loadMore = vi.fn();
    hooks.list.mockReturnValue(list({ reviews: [review("1", { verified: true, rating: 5 }), review("2")], total: 12, hasMore: true, loadMore }));
    hooks.mine.mockReturnValue(mine({ status: "signedOut" }));
    wrap(<ProductReviews productId="296" rating={{ average: 4.5, count: 12 }} />);
    expect(screen.getByRole("heading", { name: "Reviews" })).toBeInTheDocument();
    expect(screen.getByText("Based on 12 reviews")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "5 out of 5 stars" })).toBeInTheDocument();
    expect(screen.getAllByText("Verified buyer")).toHaveLength(1);
    expect(screen.getByText("Review 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show more reviews" }));
    expect(loadMore).toHaveBeenCalled();
    // Guests are sent to sign in.
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("has an empty state and a retry", () => {
    hooks.list.mockReturnValue(list());
    hooks.mine.mockReturnValue(mine({ status: "signedOut" }));
    const { unmount } = wrap(<ProductReviews productId="296" rating={{ average: 0, count: 0 }} />);
    expect(screen.getAllByText("No reviews yet").length).toBeGreaterThan(0);
    unmount();
    const retry = vi.fn();
    hooks.list.mockReturnValue(list({ isError: true, retry }));
    wrap(<ProductReviews productId="296" rating={{ average: 0, count: 0 }} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalled();
  });

  it("shows the customer's own review while it waits for approval", () => {
    hooks.list.mockReturnValue(list());
    const own: MyReview = { ...review("9"), text: "My words", status: "pending" };
    hooks.mine.mockReturnValue(mine({ review: own }));
    wrap(<ProductReviews productId="296" rating={{ average: 0, count: 0 }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Awaiting approval");
    expect(screen.getByText("My words")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit review" })).not.toBeInTheDocument();
  });

  it("writes a review: field errors, then a sent message", async () => {
    hooks.list.mockReturnValue(list());
    const submit = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, code: "invalid", errors: { rating: "rating_required", text: "text_too_short" } })
      .mockResolvedValueOnce({ ok: false, code: "unavailable" })
      .mockResolvedValueOnce({ ok: true });
    hooks.mine.mockReturnValue(mine({ submit }));
    wrap(<ProductReviews productId="296" rating={{ average: 0, count: 0 }} />);
    const send = () => act(async () => fireEvent.click(screen.getByRole("button", { name: "Submit review" })));

    await send();
    expect(screen.getByText("Choose a rating from 1 to 5 stars.")).toBeInTheDocument();
    expect(screen.getByText("Write at least 10 characters.")).toBeInTheDocument();
    expect(screen.getByLabelText("Your review")).toHaveAttribute("aria-invalid", "true");

    fireEvent.click(screen.getByLabelText("4 stars"));
    fireEvent.change(screen.getByLabelText("Your review"), { target: { value: "Boils fast, looks great." } });
    expect(screen.queryByText("Choose a rating from 1 to 5 stars.")).not.toBeInTheDocument();
    await send();
    expect(submit).toHaveBeenLastCalledWith({ rating: 4, text: "Boils fast, looks great." });
    expect(screen.getByRole("alert")).toHaveTextContent("couldn’t send your review");

    await send();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("once it’s approved"), expect.anything());
  });

  it("uses Arabic plurals", () => {
    hooks.list.mockReturnValue(list({ reviews: [review("1")], total: 3 }));
    hooks.mine.mockReturnValue(mine({ status: "signedOut" }));
    wrap(<ProductReviews productId="296" rating={{ average: 4, count: 3 }} />, "ar");
    expect(screen.getByText("بناءً على 3 تقييمات")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تسجيل الدخول" })).toBeInTheDocument();
  });
});
