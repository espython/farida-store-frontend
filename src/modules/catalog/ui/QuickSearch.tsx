"use client";
import { Button, Image, Spinner } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
import Price from "./Price";
import type { Locale } from "@/shared/kernel/Locale";
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
        <p className="text-garden-muted">{errors("title")}</p>
        <Button className={buttonClass()} onClick={() => search.refetch()}>
          {errors("retry")}
        </Button>
      </div>
    );
  }

  if (search.pending) {
    return (
      <div className="flex justify-center py-5" aria-busy="true">
        <Spinner color="primary" />
      </div>
    );
  }

  if (search.items.length === 0) {
    return <p className="text-center text-garden-muted capitalize py-6">{t("noResults")}</p>;
  }

  return (
    <div className="flex flex-col gap-5 items-center">
      <ul className="grid grid-cols-1 md:grid-cols-2 w-full gap-3" data-testid="quick-search-results">
        {search.items.map((product) => (
          <li key={product.id}>
            <QuickSearchItem product={product} onPick={onPick} />
          </li>
        ))}
      </ul>
      <Button
        className={`${buttonClass({ variant: "outline" })} capitalize`}
        onClick={() => onShowAll(search.term)}
      >
        {t("results")}
      </Button>
    </div>
  );
};

const QuickSearchItem = ({ product, onPick }: { product: Product; onPick: () => void }) => {
  const image = product.images[0];
  return (
    <Link
      href={`/product/${product.slug}`}
      onClick={onPick}
      className="grid grid-cols-[4.5rem_1fr] gap-4 items-center p-2 rounded-2xl bg-white hover:bg-sand transition-colors"
    >
      <div className="w-[4.5rem] aspect-square rounded-xl overflow-hidden bg-sand">
        {image && <Image src={image.thumbnail || image.src} alt="" radius="none" removeWrapper className="w-full h-full object-cover" />}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-semibold line-clamp-1">{product.title}</span>
        <Price price={product.price} regularPrice={product.regularPrice} size="sm" />
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
    <div className="flex flex-wrap items-center justify-center gap-2" data-testid="common-searches">
      <span className="text-sm font-semibold capitalize text-garden-muted">{t("common")}</span>
      {top.map((cat) => (
        <Link key={cat.id} href={`/categories/${cat.slug}`} onClick={onPick}>
          <span className="inline-flex items-center h-10 px-4 rounded-full bg-white border border-line text-sm font-semibold hover:border-garden transition-colors">
            {cat.title}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default QuickSearch;
