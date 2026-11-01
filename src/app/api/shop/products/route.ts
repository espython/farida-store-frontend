import { z } from "zod";
import { defineRoute, parseQuery } from "@/shared/infrastructure/bff";
import { listProducts } from "@/modules/catalog/index.server";
import { NextResponse } from "next/server";
import { catalogFilterBase, priceRangeIssue, priceRangeValid } from "../catalogSchemas";

// ids: up to 50 product ids, comma separated (a wishlist); the other filters are then ignored.
const idList = z
  .string()
  .regex(/^[1-9]\d{0,9}(,[1-9]\d{0,9}){0,49}$/, "Invalid ids")
  .transform((v) => v.split(",").filter((id, i, all) => all.indexOf(id) === i));

const schema = catalogFilterBase
  .extend({ search: z.string().trim().min(1).max(100).optional(), ids: idList.optional() })
  .refine(priceRangeValid, priceRangeIssue);

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const q = parseQuery(req, schema);
    const page = await listProducts({
      ...q,
      // Prices come in whole EGP from the URL; Woo filters in minor units.
      minPrice: q.minPrice === undefined ? undefined : q.minPrice * 100,
      maxPrice: q.maxPrice === undefined ? undefined : q.maxPrice * 100,
    });
    return NextResponse.json(page);
  },
});
