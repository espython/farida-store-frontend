import { AppError } from "@/shared/kernel/AppError";
import { Money } from "@/shared/kernel/Money";
import type { Cart, CartLine, ProductRef } from "../domain/cart";
import type { StoreCart, StoreCartItem, StoreCartPrices } from "./storeCartDto";

const money = (prices: StoreCartPrices, value: string): Money => {
  if (prices.currency_code !== "EGP" || prices.currency_minor_unit !== 2) {
    throw new AppError("invalid_money", `Unsupported currency ${prices.currency_code}`, 502);
  }
  return Money.fromMinorUnits(value);
};

/** Last path segment of the product permalink, decoded (Arabic slugs come percent-encoded). */
export const slugFromPermalink = (permalink: string): string => {
  const segment = permalink.replace(/\/+$/, "").split("/").pop() ?? "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const toProductRef = (item: StoreCartItem): ProductRef => {
  const price = money(item.prices, item.prices.price);
  const regular = item.prices.regular_price ? money(item.prices, item.prices.regular_price) : null;
  const image = item.images?.[0];
  return {
    id: String(item.id),
    slug: slugFromPermalink(item.permalink),
    title: item.name,
    image: image ? image.thumbnail || image.src : null,
    unitPrice: price,
    regularUnitPrice: regular && regular.amount > price.amount ? regular : null,
    maxQuantity: item.quantity_limits.editable ? item.quantity_limits.maximum : item.quantity,
  };
};

const toLine = (item: StoreCartItem): CartLine => ({ product: toProductRef(item), quantity: item.quantity });

/** Store API cart → the same Cart aggregate the guest cart uses. */
export const toCart = (dto: StoreCart): Cart => ({ lines: dto.items.map(toLine) });

/** Woo's item key for a product, needed to update or remove its line. */
export const lineKeyFor = (dto: StoreCart, productId: string): string | null =>
  dto.items.find((i) => String(i.id) === productId)?.key ?? null;
