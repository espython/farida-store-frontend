import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, parseQuery } from "@/shared/infrastructure/bff";
import { listProducts } from "@/modules/catalog/index.server";
import { localeSchema } from "../catalogSchemas";

const schema = z.object({
  q: z.string().trim().min(2).max(100),
  locale: localeSchema,
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(12),
});

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const { q, ...rest } = parseQuery(req, schema);
    return NextResponse.json(await listProducts({ ...rest, sort: "popularity", search: q }));
  },
});
