import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import { Money } from "@/shared/kernel/Money";
import type { Product } from "../domain/Product";

const state = vi.hoisted(() => ({
  products: { data: undefined, isLoading: false } as Record<string, unknown>,
  lastArgs: undefined as unknown,
}));

vi.mock("../application/catalogApi", () => ({
  useGetProductsQuery: (args: unknown) => {
    state.lastArgs = args;
    return state.products;
  },
}));
vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("react-inner-image-zoom", () => ({
  default: ({ src, imgAttributes }: { src: string; imgAttributes?: { alt?: string } }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={imgAttributes?.alt} data-testid="zoom-image" />
  ),
}));

import BestSellers from "./BestSellers";
import ProductDetails from "./ProductDetails";
import ProductGallery from "./ProductGallery";

const product = (over: Partial<Product> = {}): Product => ({
  id: "1",
  slug: "pots-pans",
  title: "Pots & Pans",
  shortDescription: "<p>Short</p>",
  description: "<p>Non-stick &amp; durable.</p><script>alert(1)</script>",
  sku: "",
  price: Money.fromDecimal("720.00"),
  regularPrice: Money.fromDecimal("800.00"),
  stock: { status: "in_stock", quantity: null },
  images: [
    { id: 1, src: "https://x/a.jpg", thumbnail: "https://x/a-t.jpg", alt: "Front" },
    { id: 2, src: "https://x/b.jpg", thumbnail: "https://x/b-t.jpg", alt: "Back" },
  ],
  categories: [{ id: "5", slug: "cookware", title: "Cookware" }],
  attributes: [
    {
      slug: "pa_color",
      name: "Color",
      terms: [
        { slug: "red", name: "Red" },
        { slug: "blue", name: "Blue" },
      ],
    },
  ],
  rating: { average: 4, count: 3 },
  locale: "en",
  ...over,
});

const wrap = (ui: React.ReactNode, locale: "en" | "ar" = "en") =>
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : ar}>
      {ui}
    </NextIntlClientProvider>
  );

describe("ProductDetails", () => {
  it("shows title, prices, discount, plain-text description, attributes and category links", () => {
    wrap(<ProductDetails product={product()} />);
    expect(screen.getByRole("heading", { name: "Pots & Pans" })).toBeInTheDocument();
    expect(screen.getByText(/^720/)).toBeInTheDocument();
    expect(screen.getByText(/^800$/)).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByText("Non-stick & durable.")).toBeInTheDocument();
    expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    expect(screen.getByText("Red, Blue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cookware" })).toHaveAttribute("href", "/categories/cookware");
    expect(screen.getByText(en.productPage.details.inStock)).toBeInTheDocument();
  });

  it("falls back to the short description and hides the discount when not on sale", () => {
    wrap(<ProductDetails product={product({ description: "", regularPrice: null })} />);
    expect(screen.getByText("Short")).toBeInTheDocument();
    expect(screen.queryByText(en.productPage.details.discount, { exact: false })).not.toBeInTheDocument();
  });

  it("shows out of stock, and the remainder when stock is low", () => {
    const { unmount } = wrap(
      <ProductDetails product={product({ stock: { status: "out_of_stock", quantity: null } })} />
    );
    expect(screen.getByText(en.productPage.details.outStock)).toBeInTheDocument();
    unmount();
    wrap(<ProductDetails product={product({ stock: { status: "low", quantity: 2 } })} />);
    expect(screen.getByText(`(${en.product.onlyLeft}: 2)`)).toBeInTheDocument();
  });

  it("uses the Arabic list separator and translations in ar", () => {
    wrap(<ProductDetails product={product({ locale: "ar" })} />, "ar");
    expect(screen.getByText("Red، Blue")).toBeInTheDocument();
    expect(screen.getByText(ar.productPage.details.inStock)).toBeInTheDocument();
  });
});

describe("ProductGallery", () => {
  it("switches the main image when a thumbnail is chosen", () => {
    wrap(<ProductGallery images={product().images} title="Pots" />);
    expect(screen.getByTestId("zoom-image")).toHaveAttribute("src", "https://x/a.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId("zoom-image")).toHaveAttribute("src", "https://x/b.jpg");
  });

  it("renders a placeholder without images", () => {
    wrap(<ProductGallery images={[]} title="Pots" />);
    expect(screen.getByTestId("gallery-empty")).toBeInTheDocument();
  });
});

describe("BestSellers", () => {
  it("asks for popular products and leaves out the current one", () => {
    state.products = {
      isLoading: false,
      data: {
        items: [product(), product({ id: "2", slug: "kettle", title: "Kettle", regularPrice: null })],
        page: 1,
        total: 2,
        totalPages: 1,
      },
    };
    wrap(<BestSellers excludeId="1" count={4} />);
    expect(state.lastArgs).toEqual({ locale: "en", sort: "popularity", perPage: 5 });
    expect(screen.queryByText("Pots & Pans")).not.toBeInTheDocument();
    expect(screen.getByText("Kettle").closest("a")).toHaveAttribute("href", "/product/kettle");
  });

  it("renders nothing when there are no other products", () => {
    state.products = { isLoading: false, data: { items: [product()], page: 1, total: 1, totalPages: 1 } };
    const { container } = wrap(<BestSellers excludeId="1" />);
    expect(container).toBeEmptyDOMElement();
  });
});
