"use client";
import { Checkbox, Select, SelectItem } from "@nextui-org/react";
import React, { useContext } from "react";

import { MdGridView } from "react-icons/md";
import { MdOutlineViewAgenda } from "react-icons/md";
import FilterButton from "./FilterButton";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/navigation";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import ActiveFilters from "./ActiveFilters";
import { useLocale, useTranslations } from "next-intl";

const FiltersSection = () => {
  const t = useTranslations("filters");
  const locale = useLocale();
  const { viewStyle } = useContext(StoreContext);

  const selections: { value: string; label: string }[] = [
    { value: "", label: t("popularity") },
    { value: "rating", label: t("rating") },
    { value: "createdAt:DESC", label: t("newest") },
    { value: "price:ASC", label: t("lowPrice") },
    { value: "price:DESC", label: t("highPrice") },
  ];

  const pageSizeSelections: { value: string; label: string }[] = [
    {
      value: "",
      label: "12",
    },
    {
      value: "16",
      label: "16",
    },
    {
      value: "20",
      label: "20",
    },
    {
      value: "24",
      label: "24",
    },
  ];

  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();

  const params = new URLSearchParams(searchParams);

  const salesOnly = searchParams.get("salesonly");

  const handleSortSearch = (param: string) => {
    if (param) {
      params.set("sort", param);
    } else {
      params.delete("sort");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handlePageSizeSearch = (param: string) => {
    if (param) {
      params.set("psize", param);
    } else {
      params.delete("psize");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSalesOnlySearch = (param: boolean) => {
    if (param) {
      params.set("salesonly", "true");
    } else {
      params.delete("salesonly");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const viewButton = (active: boolean) =>
    `w-11 h-11 grid place-items-center rounded-full transition-colors ${
      active ? "bg-garden text-cream" : "bg-white text-garden hover:bg-sand"
    }`;

  return (
    <section id="filters" className="flex flex-col gap-4 scroll-mt-32" dir={locale === "en" ? "ltr" : "rtl"}>
      {(searchParams.has("color") ||
        searchParams.has("min_price") ||
        searchParams.has("max_price")) && <ActiveFilters />}

      <div className="flex flex-wrap items-center gap-3">
        <FilterButton />
        <Checkbox
          isSelected={salesOnly === "true"}
          color="success"
          onChange={(e) => {
            handleSalesOnlySearch(e.target.checked);
          }}
          classNames={{
            base: "m-0 h-11 px-4 bg-white rounded-full max-w-none",
            label: "text-garden font-semibold",
          }}
        >
          {t("sales")}
        </Checkbox>

        <div className="flex items-center gap-3 basis-full md:basis-auto md:ms-auto">
          <Select
            aria-label={t("sort")}
            radius="full"
            size="sm"
            defaultSelectedKeys={[searchParams.get("sort") ?? selections[0].value]}
            onChange={(e) => {
              handleSortSearch(e.target.value);
            }}
            className="flex-1 md:w-56"
            classNames={{ trigger: "h-11 bg-white shadow-none", value: "text-garden font-semibold" }}
          >
            {selections.map((sel) => (
              <SelectItem key={sel.value} value={sel.value}>
                {sel.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            aria-label={t("pageSize")}
            radius="full"
            size="sm"
            defaultSelectedKeys={[searchParams.get("psize") ?? pageSizeSelections[0].value]}
            onChange={(e) => {
              handlePageSizeSearch(e.target.value);
            }}
            className="hidden lg:block w-24"
            classNames={{ trigger: "h-11 bg-white shadow-none", value: "text-garden font-semibold" }}
          >
            {pageSizeSelections.map((sel) => (
              <SelectItem key={sel.value} value={sel.value}>
                {sel.label}
              </SelectItem>
            ))}
          </Select>

          <div className="hidden md:flex gap-2">
            <button
              type="button"
              aria-label={t("gridView")}
              aria-pressed={viewStyle.gridView}
              className={viewButton(viewStyle.gridView)}
              onClick={() => viewStyle.displayGridView()}
            >
              <MdGridView className="text-xl" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={t("rowView")}
              aria-pressed={!viewStyle.gridView}
              className={viewButton(!viewStyle.gridView)}
              onClick={() => viewStyle.displayRowView()}
            >
              <MdOutlineViewAgenda className="text-xl" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default observer(FiltersSection);
