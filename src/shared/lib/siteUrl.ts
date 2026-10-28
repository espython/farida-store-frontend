/** Public origin of the storefront, for canonical URLs, Open Graph and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** Absolute URL for a site path such as `/en/product/kettle`. */
export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
