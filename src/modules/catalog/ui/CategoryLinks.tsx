"use client";
import { Button } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/navigation";
import { buttonClass } from "@/shared/ui/Button";
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
        <span className="text-sm text-garden-muted">{t("title")}</span>
        <Button size="sm" className={`${buttonClass()} w-fit`} onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {visibleCategories(data).map((cat) => {
        const current = sameSlug(active, cat.slug);
        return (
          <li key={cat.id}>
            <Link
              href={`/categories/${cat.slug}`}
              onClick={onSelect}
              aria-current={current ? "page" : undefined}
              className={`flex items-center justify-between gap-3 min-h-[44px] px-3 -mx-3 rounded-xl hover:bg-sand transition-colors ${
                current ? "font-bold text-saffron-ink" : ""
              }`}
            >
              <span>{cat.title}</span>
              <span className="text-sm text-garden-muted">({cat.productCount})</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default CategoryLinks;
