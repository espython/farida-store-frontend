import { NextResponse } from "next/server";
import { z } from "zod";
import { defineRoute, parseQuery } from "@/shared/infrastructure/bff";
import { listColors } from "@/modules/catalog/index.server";
import { localeSchema } from "../catalogSchemas";

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = defineRoute({
  GET: async (req) => {
    const { locale } = parseQuery(req, z.object({ locale: localeSchema }));
    return NextResponse.json(await listColors(locale));
  },
});
