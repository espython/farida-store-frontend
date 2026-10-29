"use client";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/navigation";
import type { Locale } from "@/shared/kernel/Locale";
import { useGetColorsQuery } from "../application/catalogApi";
import { sameSlug } from "../application/lookups";

const FALLBACK_SWATCH = "#d1d5db";

interface Props {
  onSelect?: () => void;
}

/** Colour filter written to the legacy `color` URL param, now holding the colour slug. */
const ColorOptions = ({ onSelect }: Props) => {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("color");
  const { data } = useGetColorsQuery(locale);

  const choose = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    // Choosing the active colour again clears it.
    if (sameSlug(selected, slug)) params.delete("color");
    else params.set("color", slug);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    onSelect?.();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(data ?? []).map((color) => {
        const on = sameSlug(selected, color.slug);
        return (
          <button
            key={color.id}
            type="button"
            aria-pressed={on}
            onClick={() => choose(color.slug)}
            className={`inline-flex items-center gap-2 h-11 ps-2 pe-4 rounded-full bg-white border-2 font-semibold transition-colors ${
              on ? "border-garden" : "border-transparent hover:border-line"
            }`}
          >
            <span
              data-testid="color-swatch"
              className="w-7 h-7 rounded-full border border-black/10"
              style={{ backgroundColor: color.hex ?? FALLBACK_SWATCH }}
            />
            {color.name}
            {on && <span aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
};

export default ColorOptions;
