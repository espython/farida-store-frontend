import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import { Money } from "@/shared/kernel/Money";
import type { Product } from "../domain/Product";
import CatalogProductCard from "./CatalogProductCard";

vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const product = (over: Partial<Product> = {}): Product => ({
  id: "1",
  slug: "pots-pans",
  title: "Pots & Pans",
  shortDescription: "",
  description: "",
  sku: "",
  price: Money.fromDecimal("720.00"),
  regularPrice: Money.fromDecimal("800.00"),
  stock: { status: "in_stock", quantity: null },
  images: [{ id: 1, src: "https://x/a.jpg", thumbnail: "https://x/a.jpg", alt: "Set" }],
  categories: [],
  attributes: [],
  rating: { average: 4, count: 3 },
  locale: "en",
  ...over,
});

const renderCard = (p: Product, locale: "en" | "ar" = "en", actions?: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      <CatalogProductCard product={p} actions={actions} />
    </NextIntlClientProvider>
  );

describe("CatalogProductCard", () => {
  it("shows title, sale price, struck regular price, discount badge and a slug link", () => {
    renderCard(product());
    expect(screen.getByText("Pots & Pans")).toBeInTheDocument();
    expect(screen.getByText(/720\.00/)).toBeInTheDocument();
    expect(screen.getByText(/800\.00/)).toBeInTheDocument();
    expect(screen.getByText(/-10%/)).toBeInTheDocument();
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/product/pots-pans");
  });

  it("shows only the price when not on sale, and no badge", () => {
    renderCard(product({ regularPrice: null }));
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/800\.00/)).not.toBeInTheDocument();
  });

  it("flags out of stock and low stock", () => {
    const { unmount } = renderCard(product({ stock: { status: "out_of_stock", quantity: 0 } }));
    expect(screen.getByText("out of stock")).toBeInTheDocument();
    unmount();
    renderCard(product({ stock: { status: "low", quantity: 2 } }));
    expect(screen.getByText(/left in stock: 2/)).toBeInTheDocument();
  });

  it("renders the injected actions and localises into Arabic with rtl", () => {
    const { container } = renderCard(product(), "ar", <button>act</button>);
    expect(screen.getByRole("button", { name: "act" })).toBeInTheDocument();
    expect(screen.getByText(/تخفيضات/)).toBeInTheDocument();
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
  });
});
