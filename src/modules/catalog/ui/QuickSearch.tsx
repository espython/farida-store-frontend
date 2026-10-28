"use client";
import { Button, Chip, Image, Spinner } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import type { Locale } from "@/shared/kernel/Locale";
import { Money } from "@/shared/kernel/Money";
import { useGetCategoriesQuery } from "../application/catalogApi";
import { featuredCategories } from "../application/lookups";
import { useQuickSearch } from "../application/useQuickSearch";
import type { Product } from "../domain/Product";

interface Props {
  /** What the shopper has typed so far. */
  term: string;
  /** Called when a result or category link is followed, e.g. to close the overlay. */
  onPick: () => void;
  /** Opens the full results page for the term. */
  onShowAll: (term: string) => void;
}

const COMMON_CATEGORIES = 4;

/** Search overlay body on the Woo catalog: popular categories, then live results while typing. */
const QuickSearch = ({ term, onPick, onShowAll }: Props) => {
  const locale = useLocale() as Locale;
  const t = useTranslations("search");
  const errors = useTranslations("errorPage");
  const search = useQuickSearch(term, locale);

  if (!search.active) return <CommonSearches locale={locale} onPick={onPick} />;

  if (search.isError) {
    return (
      <div className="flex flex-col items-center gap-3" role="alert">
        <p className="text-mainBlack/70">{errors("title")}</p>
        <Button className="bg-mainPink text-mainWhite" onClick={() => search.refetch()}>
          {errors("retry")}
        </Button>
      </div>
    );
  }

  if (search.pending) {
    return (
      <div className="flex justify-center py-5" aria-busy="true">
        <Spinner color="default" />
      </div>
    );
  }

  if (search.items.length === 0) {
    return <p className="text-center text-mainBlack/70 capitalize">{t("noResults")}</p>;
  }

  return (
    <div className="flex flex-col gap-5 items-center justify-center xl:px-28 2xl:px-32">
      <ul className="grid grid-cols-1 md:grid-cols-2 w-full px-5 gap-5" data-testid="quick-search-results">
        {search.items.map((product) => (
          <li key={product.id}>
            <QuickSearchItem product={product} onPick={onPick} />
          </li>
        ))}
      </ul>
      <Button
        className="bg-mainBlack text-mainWhite p-2 md:p-3 capitalize"
        onClick={() => onShowAll(search.term)}
      >
        {t("results")}
      </Button>
    </div>
  );
};

const QuickSearchItem = ({ product, onPick }: { product: Product; onPick: () => void }) => {
  const currency = useTranslations("currency");
  const image = product.images[0];
  return (
    <Link
      href={`/product/${product.slug}`}
      onClick={onPick}
      className="grid grid-cols-[1fr_3fr] gap-5 items-center"
    >
      <div className="w-full h-auto aspect-square bg-mainGray">
        {image && (
          <Image
            src={image.thumbnail || image.src}
            alt={image.alt || product.title}
            className="w-full h-full object-contain"
          />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs md:text-xl font-semibold line-clamp-1">{product.title}</span>
        <div className="flex flex-wrap items-center gap-5">
          {product.regularPrice && (
            <span className="text-sm md:text-2xl text-mainBlack/30 font-bold line-through">
              {Money.toDecimal(product.regularPrice)}
              <span className="text-sm ltr:ml-1 rtl:mr-1">{currency("currency")}</span>
            </span>
          )}
          <span className="text-sm md:text-2xl text-mainBlack/70 font-bold">
            {Money.toDecimal(product.price)}
            <span className="text-sm ltr:ml-1 rtl:mr-1">{currency("currency")}</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

/** The categories with the most products, as shortcuts before anything is typed. */
const CommonSearches = ({ locale, onPick }: { locale: Locale; onPick: () => void }) => {
  const t = useTranslations("search");
  const { data } = useGetCategoriesQuery(locale);
  const top = featuredCategories(data).slice(0, COMMON_CATEGORIES);

  if (top.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-5" data-testid="common-searches">
      <span className="text-sm md:text-xl capitalize">{t("common")}</span>
      {top.map((cat) => (
        <Link key={cat.id} href={`/categories/${cat.slug}`} onClick={onPick}>
          <Chip
            variant="bordered"
            className="cursor-pointer text-xs md:text-sm"
            classNames={{ base: "hover:text-mainBlack hover:border-mainBlack transition-all" }}
          >
            {cat.title}
          </Chip>
        </Link>
      ))}
    </div>
  );
};

export default QuickSearch;
