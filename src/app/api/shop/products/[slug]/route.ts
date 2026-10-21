import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, parseQuery } from "@/shared/infrastructure/bff";
import { getProductBySlug } from "@/modules/catalog/index.server";
import { localeSchema, slugSchema } from "../../catalogSchemas";

export const { GET, POST, PUT, PATCH, DELETE } = defineRoute<{ params: { slug: string } }>({
  GET: async (req, { params }) => {
    const slug = slugSchema.parse(params.slug);
    const { locale } = parseQuery(req, z.object({ locale: localeSchema }));
    return NextResponse.json(await getProductBySlug(slug, locale));
  },
});
