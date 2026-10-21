import { AppError } from "@/shared/kernel/AppError";
import type { Locale } from "@/shared/kernel/Locale";
import { Money } from "@/shared/kernel/Money";
import type { Category } from "../domain/Category";
import type { Product, StockStatus } from "../domain/Product";
import type { WooPrices, WooStoreCategory, WooStoreProduct } from "./wooProductDto";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Woo returns names HTML-escaped (e.g. "Pots &amp; Pans"); titles are plain text here. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

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
