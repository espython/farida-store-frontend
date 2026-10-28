import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/shared/lib/siteUrl";

/** Private and per-shopper pages; the catalog stays crawlable. */
const PRIVATE_PATHS = [
  "/api/",
  "/*/cart",
  "/*/order",
  "/*/payment-callback",
  "/*/trackorder",
  "/*/user",
  "/*/wishlist",
  "/*/login",
  "/*/register",
  "/*/search",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
