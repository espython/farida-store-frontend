"use client";
import { Button } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/navigation";
import type { Locale } from "@/shared/kernel/Locale";
import { useGetCategoriesQuery } from "../application/catalogApi";
import { sameSlug, visibleCategories } from "../application/lookups";

interface Props {
  /** Called after a category is chosen, e.g. to close the filter sidebar. */
  onSelect?: () => void;
}

const CategoryLinks = ({ onSelect }: Props) => {
  const locale = useLocale() as Locale;
  const t = useTranslations("errorPage");
  const routeParams = useParams();
  const active = typeof routeParams?.name === "string" ? routeParams.name : null;
  const { data, isLoading, isError, refetch } = useGetCategoriesQuery(locale);

  if (isLoading) return <div className="flex flex-col gap-3" aria-busy="true" />;

  if (isError) {
    return (
      <div className="flex flex-col gap-2" role="alert">
        <span className="text-sm text-mainBlack/70">{t("title")}</span>
        <Button size="sm" className="bg-mainPink text-mainWhite w-fit" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleCategories(data).map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.slug}`}
          onClick={onSelect}
          className={`filter-link ${sameSlug(active, cat.slug) ? "text-mainPink" : ""}`}
        >
          <h1>{cat.title}</h1>
          <h1>({cat.productCount})</h1>
        </Link>
      ))}
    </div>
  );
};

export default CategoryLinks;
