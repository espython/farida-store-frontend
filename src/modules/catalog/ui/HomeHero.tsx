"use client";
import { Image, Skeleton } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import type { Locale } from "@/shared/kernel/Locale";
import { useGetCategoriesQuery } from "../application/catalogApi";
import { featuredCategories } from "../application/lookups";
import type { Category } from "../domain/Category";

const Arrow = () => (
  <span aria-hidden="true" className="inline-block rtl:rotate-180">
    →
  </span>
);

const Photo = ({ category, className }: { category: Category; className: string }) => (
  <Image src={category.image?.src ?? ""} alt="" radius="none" removeWrapper className={`object-cover ${className}`} />
);

/**
 * Home hero built from the catalog itself: the biggest categories with photos fill a
 * feature card and two promos (one of them the on-sale filter). Hidden when the shop
 * has fewer than three such categories or is unreachable.
 */
const HomeHero = () => {
  const locale = useLocale() as Locale;
  const t = useTranslations("homeHero");
  const { data, isLoading } = useGetCategoriesQuery(locale);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-4 md:gap-6" aria-busy="true">
        <Skeleton className="flex-[2_1_560px] h-[429px] md:h-[420px] rounded-3xl" />
        <div className="flex-[1_1_300px] flex flex-col gap-4 md:gap-6">
          <Skeleton className="flex-1 min-h-[196px] rounded-3xl" />
          <Skeleton className="flex-1 min-h-[196px] rounded-3xl" />
        </div>
      </div>
    );
  }

  const [main, sale, other] = featuredCategories(data).filter((c) => c.image);
  if (!main || !sale || !other) return null;

  return (
    <section aria-label={t("label")} className="flex flex-wrap gap-4 md:gap-6">
      <Link
        href={`/categories/${main.slug}`}
        className="group relative flex-[2_1_560px] h-[429px] md:h-[420px] rounded-3xl overflow-hidden bg-sand"
      >
        <Photo category={main} className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-[1.02]" />
        <div className="absolute z-20 inset-x-3 bottom-3 md:inset-x-6 md:bottom-6 md:max-w-[440px] bg-cream rounded-[20px] p-5 md:p-7 flex flex-col gap-2 md:gap-3">
          <span className="text-xs md:text-sm font-bold tracking-wider uppercase text-saffron-ink">{t("kicker")}</span>
          <h1 className="font-display text-[1.75rem] md:text-[2.5rem] leading-[1.1] font-medium">{t("title")}</h1>
          <span className="self-start mt-1 inline-flex items-center gap-2 bg-garden text-cream font-bold rounded-full px-6 py-3">
            {t("shop")} {main.title} <Arrow />
          </span>
        </div>
      </Link>

      <div className="flex-[1_1_300px] flex flex-col gap-4 md:gap-6">
        <Link href="/?salesonly=true#filters" className="group flex flex-1 min-h-[196px] rounded-3xl overflow-hidden bg-saffron">
          <div className="flex-1 p-6 flex flex-col justify-center gap-1.5">
            <span className="font-display text-2xl md:text-[1.625rem] leading-tight">{t("saleTitle")}</span>
            <span className="font-bold">
              {t("saleCta")} <Arrow />
            </span>
          </div>
          <Photo category={sale} className="w-[42%] h-auto" />
        </Link>
        <Link href={`/categories/${other.slug}`} className="group flex flex-1 min-h-[196px] rounded-3xl overflow-hidden bg-white">
          <div className="flex-1 p-6 flex flex-col justify-center gap-1.5">
            <span className="font-display text-2xl md:text-[1.625rem] leading-tight">{other.title}</span>
            <span className="font-bold">
              {t("browse")} <Arrow />
            </span>
          </div>
          <Photo category={other} className="w-[42%] h-auto" />
        </Link>
      </div>
    </section>
  );
};

export default HomeHero;
