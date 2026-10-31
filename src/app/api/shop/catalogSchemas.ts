import { z } from "zod";
import { LOCALES } from "@/shared/kernel/Locale";
import { DEFAULT_SORT, PRODUCT_SORTS } from "@/modules/catalog/index.server";

export const localeSchema = z.enum(LOCALES).default("en");

export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[^\s/\\?#]+$/, "Invalid slug")
  .refine((v) => !v.includes(".."), "Invalid slug");

export const catalogFilterBase = z.object({
  locale: localeSchema,
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(12),
  sort: z.enum(PRODUCT_SORTS).default(DEFAULT_SORT),
  onSale: z
    .enum(["1", "true", "0", "false"])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  category: slugSchema.optional(),
  color: slugSchema.optional(),
  minPrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
  // Woo treats max_price=0 as "no filter", so 0 is rejected rather than silently ignored.
  maxPrice: z.coerce.number().int().min(1).max(10_000_000).optional(),
});

export const priceRangeValid = (v: { minPrice?: number; maxPrice?: number }) =>
  v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice;

export const priceRangeIssue = {
  message: "minPrice must not exceed maxPrice",
  path: ["minPrice"],
};
