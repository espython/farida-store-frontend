"use client";
import type { ReactNode } from "react";
import { Skeleton } from "@nextui-org/react";
import { useLocale } from "next-intl";
import type { Locale } from "@/shared/kernel/Locale";
import type { Product } from "../domain/Product";
import CatalogProductCard from "./CatalogProductCard";
import { useGetProductsQuery } from "../application/catalogApi";

interface Props {
  /** Product to leave out, e.g. the one on the current page. */
  excludeId?: string;
  count?: number;
  /** Per-card controls (add to cart), injected by the page. */
  renderActions?: (product: Product) => ReactNode;
  /** Control on each card image (the wishlist heart). */
  renderOverlay?: (product: Product) => ReactNode;
}

/** Row of the most popular products (Woo total_sales). Renders nothing on error. */
const BestSellers = ({ excludeId, count = 4, renderActions, renderOverlay }: Props) => {
  const locale = useLocale() as Locale;
  // One extra so the list stays full after dropping the current product.
  const { data, isLoading } = useGetProductsQuery({ locale, sort: "popularity", perPage: count + 1 });
  const items = (data?.items ?? []).filter((p) => p.id !== excludeId).slice(0, count);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-6" aria-busy="true">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="aspect-square rounded-[20px]" />
        ))}
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-6" data-testid="best-sellers">
      {items.map((p) => (
        <li key={p.id} className="flex">
          <CatalogProductCard product={p} actions={renderActions?.(p)} overlay={renderOverlay?.(p)} />
        </li>
      ))}
    </ul>
  );
};

export default BestSellers;
