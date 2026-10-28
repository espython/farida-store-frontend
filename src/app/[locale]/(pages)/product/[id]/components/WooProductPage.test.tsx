import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../../../../messages/en.json";
import { Money } from "@/shared/kernel/Money";
import type { Product } from "@/modules/catalog";

const state = vi.hoisted(() => ({ query: {} as Record<string, unknown> }));

vi.mock("@/modules/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/catalog")>()),
  useGetProductQuery: () => ({ refetch: vi.fn(), ...state.query }),
  BestSellers: () => null,
  ProductGallery: () => null,
}));
vi.mock("./Breads", () => ({ default: ({ title }: { title: string }) => <nav>{title}</nav> }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import WooProductPage from "./WooProductPage";

const product = (title: string): Product => ({
  id: "1",
  slug: "kettle",
  title,
  shortDescription: "",
  description: "<p>Boils fast.</p>",
  sku: "",
  price: Money.fromDecimal("800.00"),
  regularPrice: null,
  stock: { status: "in_stock", quantity: null },
  images: [],
  categories: [],
  attributes: [],
  rating: { average: 0, count: 0 },
  locale: "en",
});

const renderPage = (initialProduct?: Product) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <WooProductPage slug="kettle" initialProduct={initialProduct} />
    </NextIntlClientProvider>
  );

beforeEach(() => {
  state.query = { data: undefined, isLoading: true, isError: false };
});

describe("WooProductPage", () => {
  it("renders the server product while the client query is loading", () => {
    const { container } = renderPage(product("Kettle"));
    expect(screen.getByRole("heading", { name: "Kettle" })).toBeInTheDocument();
    expect(screen.getByText("Boils fast.")).toBeInTheDocument();
    expect(container.querySelector("[aria-busy=true]")).toBeNull();
  });

  it("shows the skeleton without server data", () => {
    const { container } = renderPage();
    expect(container.querySelector("[aria-busy=true]")).toBeInTheDocument();
  });

  it("prefers fresh client data and keeps the server product when a refresh fails", () => {
    state.query = { data: product("Kettle v2"), isLoading: false, isError: false };
    const { unmount } = renderPage(product("Kettle"));
    expect(screen.getByRole("heading", { name: "Kettle v2" })).toBeInTheDocument();
    unmount();

    state.query = { data: undefined, isLoading: false, isError: true, error: { status: 500 } };
    renderPage(product("Kettle"));
    expect(screen.getByRole("heading", { name: "Kettle" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("still 404s when the product is gone", () => {
    state.query = { data: undefined, isLoading: false, isError: true, error: { status: 404 } };
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderPage(product("Kettle"))).toThrow("NEXT_NOT_FOUND");
  });
});
