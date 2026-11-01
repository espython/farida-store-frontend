"use client";
import React, { useContext, useEffect } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";

import { AnimatePresence, motion } from "framer-motion";
import FilterSidebarContents from "@/app/components/FilterSidebarContents";
import { useLocale, useTranslations } from "next-intl";
import { CatalogListing } from "@/modules/catalog";
import { AddToCartButton, toProductRef } from "@/modules/cart";
import { WishlistButton } from "@/modules/wishlist";

const ProductsSection = () => {
  const { viewStyle, filter } = useContext(StoreContext);

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
      {/* The page composes catalog, cart and wishlist: the catalog imports neither. */}
      <CatalogListing
        view={viewStyle.gridView ? "grid" : "row"}
        onFiltersChange={filter.hideWholeFilterSidebar}
        renderActions={(product) => <AddToCartButton product={toProductRef(product)} />}
        renderOverlay={(product) => <WishlistButton productId={product.id} title={product.title} />}
      />

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
