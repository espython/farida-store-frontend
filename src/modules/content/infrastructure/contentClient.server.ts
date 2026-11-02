import { wooFetch } from "@/shared/infrastructure/wooClient.server";
import type { Locale } from "@/shared/kernel/Locale";
import type { Promotions } from "../domain/Promotion";
import { toPromotions } from "./promoMapper";

/** Fetch-cache tag on the promotions. */
export const CONTENT_CACHE_TAG = "content";

/** Published promotions for one language (public; cached for a minute). */
export async function listPromotions(locale: Locale): Promise<Promotions> {
  const { data } = await wooFetch<unknown>({
    path: "/farida/v1/promos",
    query: { lang: locale },
    next: { revalidate: 60, tags: [CONTENT_CACHE_TAG] },
  });
  return toPromotions(data);
}
