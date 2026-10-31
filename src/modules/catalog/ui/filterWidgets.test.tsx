import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import type { Category } from "../domain/Category";
import type { Color } from "../domain/Color";

const state = vi.hoisted(() => ({
  categories: { data: undefined, isLoading: false, isError: false, refetch: () => {} } as Record<string, unknown>,
  colors: { data: undefined } as Record<string, unknown>,
  params: new URLSearchParams(),
  route: {} as Record<string, string>,
  replace: vi.fn(),
}));

vi.mock("../application/catalogApi", () => ({
  useGetCategoriesQuery: () => state.categories,
  useGetColorsQuery: () => state.colors,
}));
vi.mock("next/navigation", () => ({
  useParams: () => state.route,
  useSearchParams: () => state.params,
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
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
  usePathname: () => "/en",
  useRouter: () => ({ replace: state.replace }),
}));

import CategoryLinks from "./CategoryLinks";
import ColorOptions from "./ColorOptions";

const cat = (slug: string, title: string, productCount: number): Category => ({
  id: slug,
  slug,
  title,
  parentId: null,
  productCount,
  image: null,
  locale: "en",
});
const color = (slug: string, name: string, hex: string | null): Color => ({
  id: slug,
  slug,
  name,
  hex,
  locale: "en",
});

const wrap = (ui: React.ReactNode, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      {ui}
    </NextIntlClientProvider>
  );

beforeEach(() => {
  state.categories = { data: undefined, isLoading: false, isError: false, refetch: vi.fn() };
  state.colors = { data: undefined };
  state.params = new URLSearchParams();
  state.route = {};
  state.replace.mockClear();
});

describe("CategoryLinks", () => {
  it("lists non-empty categories with counts and links by slug", () => {
    state.categories.data = [cat("pots", "Pots", 3), cat("empty", "Empty", 0)];
    wrap(<CategoryLinks />);
    expect(screen.getByRole("link", { name: /Pots/ })).toHaveAttribute("href", "/categories/pots");
    expect(screen.getByText("(3)")).toBeInTheDocument();
    expect(screen.queryByText("Empty")).not.toBeInTheDocument();
  });

  it("highlights the active category even when the route is percent-encoded", () => {
    state.categories.data = [cat("قدر", "قدور", 2), cat("pans", "Pans", 1)];
    state.route = { name: "%D9%82%D8%AF%D8%B1" };
    wrap(<CategoryLinks />, "ar");
    expect(screen.getByRole("link", { name: /قدور/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Pans/ })).not.toHaveAttribute("aria-current");
  });

  it("calls onSelect when a link is clicked", () => {
    state.categories.data = [cat("pots", "Pots", 3)];
    const onSelect = vi.fn();
    wrap(<CategoryLinks onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("link", { name: /Pots/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows an error with retry instead of an empty list", () => {
    state.categories = { data: undefined, isLoading: false, isError: true, refetch: vi.fn() };
    wrap(<CategoryLinks />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(state.categories.refetch).toHaveBeenCalled();
  });
});

describe("ColorOptions", () => {
  beforeEach(() => {
    state.colors.data = [color("red", "Red", "#ff0000"), color("blue", "Blue", null)];
  });

  it("renders swatches with a fallback colour when there is no hex", () => {
    const { container } = wrap(<ColorOptions />);
    const swatches = container.querySelectorAll('[data-testid="color-swatch"]');
    expect((swatches[0] as HTMLElement).style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect((swatches[1] as HTMLElement).style.backgroundColor).toBe("rgb(209, 213, 219)");
  });

  it("writes the colour slug to the URL, keeping other params, and toggles it off", () => {
    state.params = new URLSearchParams("sort=price%3AASC");
    const onSelect = vi.fn();
    wrap(<ColorOptions onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: /Red/ }));
    expect(state.replace).toHaveBeenLastCalledWith("/en?sort=price%3AASC&color=red");
    expect(onSelect).toHaveBeenCalled();

    state.params = new URLSearchParams("color=red");
    state.replace.mockClear();
    wrap(<ColorOptions />);
    const pressed = screen.getAllByRole("button", { name: /Red/ }).find(
      (b) => b.getAttribute("aria-pressed") === "true"
    )!;
    fireEvent.click(pressed);
    expect(state.replace).toHaveBeenLastCalledWith("/en");
  });
});
