import { htmlToText } from "@/shared/lib/htmlText";
import { Money } from "@/shared/kernel/Money";
import type { Product, StockLevel } from "../domain/Product";

/** Search engines cut descriptions at about this length. */
const META_DESCRIPTION_MAX = 160;

const AVAILABILITY: Record<StockLevel, string> = {
  in_stock: "https://schema.org/InStock",
  low: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
};

/** Plain-text summary for `<meta name="description">`, from the short or full description. */
export function productMetaDescription(product: Product): string {
  const text = htmlToText(product.shortDescription || product.description).replace(/\s+/g, " ").trim();
  if (text.length <= META_DESCRIPTION_MAX) return text;
  const cut = text.slice(0, META_DESCRIPTION_MAX - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > META_DESCRIPTION_MAX / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** schema.org Product with one Offer, for a `application/ld+json` script. */
export function productJsonLd(product: Product, url: string) {
  const description = productMetaDescription(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url,
    ...(description && { description }),
    ...(product.sku && { sku: product.sku }),
    ...(product.images.length > 0 && { image: product.images.map((i) => i.src) }),
    ...(product.categories[0] && { category: product.categories[0].title }),
    ...(product.rating.count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.average,
        reviewCount: product.rating.count,
      },
    }),
    offers: {
      "@type": "Offer",
      url,
      price: Money.toDecimal(product.price),
      priceCurrency: product.price.currency,
      availability: AVAILABILITY[product.stock.status],
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

/**
 * JSON for an inline `<script type="application/ld+json">`. Escapes `<` so text from the
 * shop admin (titles, descriptions) can never close the script tag.
 */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
