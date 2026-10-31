"use client";
import React, { useContext, useEffect } from "react";
import ProductsPagination from "./ProductsPagination";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";

import { AnimatePresence, motion } from "framer-motion";
import FilterSidebarContents from "@/app/components/FilterSidebarContents";
import GridStyleView from "./GridStyleView";
import RowStyleView from "./RowStyleView";
import { useLocale, useTranslations } from "next-intl";
import { CATALOG_SOURCE, CatalogListing } from "@/modules/catalog";

const ProductsSection = () => {
  const { products, viewStyle, filter } = useContext(StoreContext);

  const locale = useLocale();
  const t = useTranslations("filters");

  useEffect(() => {
    if (!filter.showFilterSideBar) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") filter.hideWholeFilterSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filter, filter.showFilterSideBar]);

  return (
    <div className="flex flex-col gap-5">
      {CATALOG_SOURCE === "woo" ? (
        <CatalogListing
          view={viewStyle.gridView ? "grid" : "row"}
          onFiltersChange={filter.hideWholeFilterSidebar}
        />
      ) : (
        <>
          {viewStyle.gridView ? <GridStyleView /> : <RowStyleView />}

          {/* ============ */}
          <ProductsPagination />
        </>
      )}

      <AnimatePresence mode="wait">
        {filter.showBackdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="filter-backdrop"
            className="backdrop z-[90]"
            onClick={filter.hideWholeFilterSidebar}
          />
        )}
      </AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t("filters")}
        initial={false}
        animate={
          filter.showFilterSideBar
            ? { x: 0, visibility: "visible" }
            : { x: locale === "en" ? "-105%" : "105%", transitionEnd: { visibility: "hidden" } }
        }
        transition={{ type: "tween", duration: 0.35 }}
        className={`fixed top-0 ${
          locale === "en" ? "left-0 rounded-e-3xl" : "right-0 rounded-s-3xl"
        } z-[100] h-[100dvh] w-[88vw] max-w-[24rem] bg-cream text-garden shadow-xl overflow-hidden`}
        dir={locale === "en" ? "ltr" : "rtl"}
      >
        <FilterSidebarContents />
      </motion.div>
    </div>
  );
};

export default observer(ProductsSection);
