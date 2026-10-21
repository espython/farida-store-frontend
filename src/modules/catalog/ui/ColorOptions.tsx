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
    <div className="flex flex-col gap-3">
      {(data ?? []).map((color) => (
        <button
          key={color.id}
          type="button"
          className="flex items-center justify-between cursor-pointer"
          aria-pressed={sameSlug(selected, color.slug)}
          onClick={() => choose(color.slug)}
        >
          <span className="flex items-center gap-2">
            <span
              className="w-5 h-5 border border-black/10"
              style={{ backgroundColor: color.hex ?? FALLBACK_SWATCH }}
            />
            <span className="text-sm md:text-xl">{color.name}</span>
          </span>
          {sameSlug(selected, color.slug) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      ))}
    </div>
  );
};

export default ColorOptions;
