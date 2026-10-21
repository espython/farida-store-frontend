export type CatalogSource = "strapi" | "woo";

/**
 * Which backend feeds the storefront catalog. Inlined at build time.
 * Stays "strapi" until the data migration; flipped to "woo" at cutover.
 */
export const CATALOG_SOURCE: CatalogSource =
  process.env.NEXT_PUBLIC_CATALOG_SOURCE === "woo" ? "woo" : "strapi";
