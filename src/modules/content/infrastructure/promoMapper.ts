import { decodeEntities } from "@/shared/lib/htmlText";
import { groupPromotions, toPromoLink, type PromoPlacement, type Promotion, type Promotions } from "../domain/Promotion";
import type { WpPromoDto } from "./wpPromoDto";

const PLACEMENTS: readonly PromoPlacement[] = ["hero", "announcement", "mini"];
const size = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.round(n) : null);

/** Images only over http(s); anything else (data:, javascript:) is dropped with its banner. */
const imageUrl = (url: unknown) => {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
};

export function toPromotion(dto: WpPromoDto): Promotion | null {
  if (!PLACEMENTS.includes(dto.placement as PromoPlacement)) return null;
  const url = dto.image ? imageUrl(dto.image.url) : null;
  return {
    id: String(dto.id),
    placement: dto.placement as PromoPlacement,
    text: decodeEntities(typeof dto.text === "string" ? dto.text : "").trim(),
    image: url ? { url, width: size(dto.image?.width), height: size(dto.image?.height), alt: String(dto.image?.alt ?? "") } : null,
    link: toPromoLink(dto.link),
  };
}

export const toPromotions = (data: unknown): Promotions =>
  groupPromotions((Array.isArray(data) ? (data as WpPromoDto[]) : []).map(toPromotion).filter((p): p is Promotion => p !== null));
