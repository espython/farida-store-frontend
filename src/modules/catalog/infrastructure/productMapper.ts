import { AppError } from "@/shared/kernel/AppError";
import type { Locale } from "@/shared/kernel/Locale";
import { Money } from "@/shared/kernel/Money";
import { decodeEntities } from "@/shared/lib/htmlText";
import type { Category } from "../domain/Category";
import type { Color } from "../domain/Color";
import type { Product, StockStatus } from "../domain/Product";
import type {
  WooPrices,
  WooStoreCategory,
  WooStoreProduct,
  WooStoreTerm,
} from "./wooProductDto";

function toMoney(prices: WooPrices, value: string): Money {
  if (prices.currency_code !== "EGP" || prices.currency_minor_unit !== 2) {
    throw new AppError(
      "invalid_money",
      `Unsupported currency ${prices.currency_code}/${prices.currency_minor_unit}`,
      502
    );
  }
  return Money.fromMinorUnits(value);
}

export function toStockStatus(inStock: boolean, lowRemaining?: number | null): StockStatus {
  if (!inStock) return { status: "out_of_stock", quantity: 0 };
  if (typeof lowRemaining === "number") return { status: "low", quantity: lowRemaining };
  return { status: "in_stock", quantity: null };
}

export function toProduct(dto: WooStoreProduct, locale: Locale): Product {
  const price = toMoney(dto.prices, dto.prices.price);
  const regular = toMoney(dto.prices, dto.prices.regular_price);
  const discounted = dto.on_sale && regular.amount > price.amount;

  return {
    id: String(dto.id),
    slug: dto.slug,
    title: decodeEntities(dto.name),
    shortDescription: dto.short_description ?? "",
    description: dto.description ?? "",
    sku: dto.sku ?? "",
    price,
    regularPrice: discounted ? regular : null,
    stock: toStockStatus(dto.is_in_stock, dto.low_stock_remaining),
    images: (dto.images ?? []).map((i) => ({
      id: i.id,
      src: i.src,
      thumbnail: i.thumbnail ?? i.src,
      alt: i.alt ?? "",
    })),
    categories: (dto.categories ?? []).map((c) => ({
      id: String(c.id),
      slug: c.slug,
      title: decodeEntities(c.name),
    })),
    attributes: (dto.attributes ?? []).map((a) => ({
      slug: a.taxonomy,
      name: decodeEntities(a.name),
      terms: (a.terms ?? []).map((t) => ({ slug: t.slug, name: decodeEntities(t.name) })),
    })),
    rating: {
      average: Number.parseFloat(dto.average_rating ?? "0") || 0,
      count: dto.review_count ?? 0,
    },
    locale,
  };
}

export function toCategory(dto: WooStoreCategory, locale: Locale): Category {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: decodeEntities(dto.name),
    parentId: dto.parent ? String(dto.parent) : null,
    productCount: dto.count,
    image: dto.image ? { src: dto.image.src, alt: dto.image.alt ?? "" } : null,
    locale,
  };
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function toColor(dto: WooStoreTerm, locale: Locale): Color {
  const hex = (dto.description ?? "").trim();
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: decodeEntities(dto.name),
    hex: HEX_RE.test(hex) ? hex.toLowerCase() : null,
    locale,
  };
}
