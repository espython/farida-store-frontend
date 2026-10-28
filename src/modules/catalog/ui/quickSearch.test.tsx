import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import { Money } from "@/shared/kernel/Money";
import type { Category } from "../domain/Category";
import type { Product } from "../domain/Product";

const state = vi.hoisted(() => ({
  search: { data: undefined, isFetching: false, isError: false } as Record<string, unknown>,
  categories: { data: undefined } as Record<string, unknown>,
  calls: [] as { args: { q: string; perPage: number }; skip: boolean }[],
}));

vi.mock("../application/catalogApi", () => ({
  useSearchProductsQuery: (args: { q: string; perPage: number }, opts: { skip: boolean }) => {
    state.calls.push({ args, skip: opts.skip });
    return { ...state.search, refetch: vi.fn() };
  },
  useGetCategoriesQuery: () => state.categories,
}));
vi.mock("@/navigation", () => ({
  Link: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

import QuickSearch from "./QuickSearch";

const product = (id: string, title: string): Product => ({
  id,
  slug: `p-${id}`,
  title,
  shortDescription: "",
  description: "",
  sku: "",
  price: Money.fromDecimal("100.00"),
  regularPrice: null,
  stock: { status: "in_stock", quantity: null },
  images: [],
  categories: [],
  attributes: [],
  rating: { average: 0, count: 0 },
  locale: "en",
});

const cat = (slug: string, productCount: number): Category => ({
  id: slug,
  slug,
  title: slug.toUpperCase(),
  parentId: null,
  productCount,
  image: null,
  locale: "en",
});

const renderSearch = (term: string, onPick = vi.fn(), onShowAll = vi.fn()) => {
  const utils = render(
    <NextIntlClientProvider locale="en" messages={en}>
      <QuickSearch term={term} onPick={onPick} onShowAll={onShowAll} />
    </NextIntlClientProvider>
  );
  const rerender = (next: string) =>
    utils.rerender(
      <NextIntlClientProvider locale="en" messages={en}>
        <QuickSearch term={next} onPick={onPick} onShowAll={onShowAll} />
      </NextIntlClientProvider>
    );
  return { ...utils, rerender, onPick, onShowAll };
};

beforeEach(() => {
  vi.useFakeTimers();
  state.calls = [];
  state.search = { data: undefined, isFetching: false, isError: false };
  state.categories = { data: [cat("a", 1), cat("uncategorized", 50), cat("b", 9), cat("c", 0), cat("d", 5), cat("e", 3), cat("f", 2)] };
});
afterEach(() => vi.useRealTimers());

describe("QuickSearch", () => {
  it("shows the four biggest non-empty categories as links before anything is typed", () => {
    const { onPick } = renderSearch(" a ");
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["B", "D", "E", "F"]);
    expect(links[0]).toHaveAttribute("href", "/categories/b");
    fireEvent.click(links[0]);
    expect(onPick).toHaveBeenCalled();
    expect(state.calls.every((c) => c.skip)).toBe(true);
  });

  it("debounces the term before querying four results", () => {
    const { rerender, container } = renderSearch("");
    rerender("ket");
    expect(container.querySelector("[aria-busy=true]")).toBeInTheDocument();
    expect(state.calls.at(-1)?.skip).toBe(true);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(state.calls.at(-1)).toEqual({ args: { locale: "en", q: "ket", perPage: 4 }, skip: false });
  });

  it("lists results that link to the product and opens all results for the term", () => {
    state.search = {
      data: { items: [product("1", "Kettle"), product("2", "Kettle XL")], page: 1, total: 9, totalPages: 3 },
      isFetching: false,
      isError: false,
    };
    const { onPick, onShowAll } = renderSearch(" kettle ");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const link = screen.getByText("Kettle").closest("a");
    expect(link).toHaveAttribute("href", "/product/p-1");
    fireEvent.click(link!);
    expect(onPick).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: en.search.results }));
    expect(onShowAll).toHaveBeenCalledWith("kettle");
  });

  it("says so when nothing matches", () => {
    state.search = { data: { items: [], page: 1, total: 0, totalPages: 0 }, isFetching: false, isError: false };
    renderSearch("zzz");
    expect(screen.getByText(en.search.noResults)).toBeInTheDocument();
  });

  it("offers a retry when the search fails", () => {
    state.search = { data: undefined, isFetching: false, isError: true };
    renderSearch("zzz");
    expect(screen.getByRole("alert")).toHaveTextContent(en.errorPage.title);
  });
});
