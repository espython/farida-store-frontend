import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import type { Category } from "../domain/Category";

const state = vi.hoisted(() => ({
  categories: {} as Record<string, unknown>,
  followed: [] as string[],
}));

vi.mock("../application/catalogApi", () => ({
  useGetCategoriesQuery: () => ({ refetch: vi.fn(), ...state.categories }),
}));
vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        state.followed.push(href);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

import CategorySlider from "./CategorySlider";

const cat = (slug: string, productCount: number, image: Category["image"] = null): Category => ({
  id: slug,
  slug,
  title: slug.toUpperCase(),
  parentId: null,
  productCount,
  image,
  locale: "en",
});

const renderSlider = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CategorySlider />
    </NextIntlClientProvider>
  );

beforeEach(() => {
  state.followed = [];
  state.categories = {
    data: [cat("a", 1), cat("uncategorized", 50), cat("b", 9, { src: "/b.jpg", alt: "" }), cat("c", 0)],
    isLoading: false,
    isError: false,
  };
});

describe("CategorySlider", () => {
  it("links each featured category by slug, biggest first", () => {
    renderSlider();
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/categories/b", "/categories/a"]);
    expect(screen.getByRole("img")).toHaveAttribute("alt", "B");
    expect(screen.getByTestId("category-image-empty")).toBeInTheDocument();
  });

  it("follows a link on a click but not at the end of a drag", () => {
    renderSlider();
    const slider = screen.getByTestId("category-slider");
    const link = screen.getAllByRole("link")[0];

    fireEvent.click(link);
    expect(state.followed).toEqual(["/categories/b"]);

    fireEvent.mouseDown(slider, { clientX: 100 });
    fireEvent.mouseMove(slider, { clientX: 40 });
    fireEvent.click(link);
    expect(state.followed).toEqual(["/categories/b"]);

    vi.useFakeTimers();
    fireEvent.mouseUp(slider);
    vi.runAllTimers();
    vi.useRealTimers();
    fireEvent.click(link);
    expect(state.followed).toEqual(["/categories/b", "/categories/b"]);
  });

  it("shows placeholders while loading and a retry on error", () => {
    state.categories = { data: undefined, isLoading: true, isError: false };
    const { unmount } = renderSlider();
    expect(screen.getByTestId("category-slider")).toHaveAttribute("aria-busy", "true");
    unmount();

    state.categories = { data: undefined, isLoading: false, isError: true };
    renderSlider();
    expect(screen.getByRole("alert")).toHaveTextContent(en.errorPage.title);
  });

  it("renders nothing without categories to show", () => {
    state.categories = { data: [cat("uncategorized", 3)], isLoading: false, isError: false };
    const { container } = renderSlider();
    expect(container).toBeEmptyDOMElement();
  });
});
