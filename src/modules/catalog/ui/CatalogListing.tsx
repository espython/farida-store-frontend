"use client";
import { useEffect } from "react";
import { Button, Pagination, Spinner } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import { useScreenSize } from "react-screen-size-helper";
import EmptyProducts from "@/app/components/EmptyProducts";
import type { Locale } from "@/shared/kernel/Locale";
import { useCatalogListing } from "../application/useCatalogListing";
import CatalogProductCard from "./CatalogProductCard";

interface Props {
  view: "grid" | "row";
  /** Called when the filters change, e.g. to close the filter sidebar. */
  onFiltersChange?: () => void;
}

const CatalogListing = ({ view, onFiltersChange }: Props) => {
  const locale = useLocale() as Locale;
  const t = useTranslations("errorPage");
  const loading = useTranslations("loading");
  const { isDesktop, isMobile } = useScreenSize({});
  const { filtersKey, page, setPage, data, isLoading, isFetching, isError, refetch } =
    useCatalogListing(locale);

  useEffect(() => {
    onFiltersChange?.();
    // Only when the filters themselves change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[50vh] grid place-items-center">
        <Spinner
          label={loading("label")}
          size="lg"
          classNames={{
            circle1: "border-l-mainPink border-b-mainPink",
            circle2: "border-mainPink",
            wrapper: "w-40 h-40",
          }}
        />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full min-h-[30vh] flex flex-col items-center justify-center gap-4" role="alert">
        <h2 className="text-lg md:text-2xl text-mainBlack/70">{t("title")}</h2>
        <Button className="bg-mainPink text-mainWhite" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div dir={locale === "en" ? "ltr" : "rtl"} className="flex flex-col gap-5">
      {data.items.length === 0 ? (
        <EmptyProducts />
      ) : (
        <div
          className={`w-full grid transition-opacity ${isFetching ? "opacity-60" : ""} ${
            view === "grid"
              ? "grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:grid-cols-4"
              : "grid-cols-1 gap-6 xl:grid-cols-2"
          }`}
          aria-busy={isFetching}
        >
          {data.items.map((product) => (
            <CatalogProductCard key={product.id} product={product} row={view === "row"} />
          ))}
        </div>
      )}
      {data.totalPages > 1 && (
        <div className="flex justify-center items-center">
          <Pagination
            showControls
            color="success"
            size={isMobile ? "sm" : isDesktop ? "md" : "lg"}
            total={data.totalPages}
            page={page}
            variant="faded"
            onChange={(next) => {
              document.getElementById("filters")?.scrollIntoView({ behavior: "smooth" });
              setPage(next);
            }}
            classNames={{ cursor: "bg-garden text-cream" }}
          />
        </div>
      )}
    </div>
  );
};

export default CatalogListing;
