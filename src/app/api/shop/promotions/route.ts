import { z } from "zod";
import { NextResponse } from "next/server";
import { defineRoute, parseQuery } from "@/shared/infrastructure/bff";
import { listPromotions } from "@/modules/content/index.server";
import { localeSchema } from "../catalogSchemas";

const query = z.object({ locale: localeSchema });

// The shop's promotions (WordPress, W7) for one language: hero banners,
// announcement bar messages and category mini-ads. Public.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const { locale } = parseQuery(req, query);
    return NextResponse.json(await listPromotions(locale));
  },
});
