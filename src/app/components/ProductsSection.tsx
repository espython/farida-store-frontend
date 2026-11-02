"use client";
import React, { useEffect } from "react";

import { AnimatePresence, motion } from "framer-motion";
import FilterSidebarContents from "@/app/components/FilterSidebarContents";
import { useLocale, useTranslations } from "next-intl";
import { CatalogListing } from "@/modules/catalog";
import { AddToCartButton, toProductRef } from "@/modules/cart";
import { WishlistButton } from "@/modules/wishlist";
import { useDrawer, useProductsView } from "@/store/ui";

const ProductsSection = () => {
  const viewStyle = useProductsView();
  const filter = useDrawer("filters");

  const locale = useLocale();
  const t = useTranslations("filters");

  useEffect(() => {
    if (!filter.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") filter.hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filter, filter.open]);

  return (
    <div className="flex flex-col gap-5">
      {/* The page composes catalog, cart and wishlist: the catalog imports neither. */}
      <CatalogListing
        view={(viewStyle.view === "grid") ? "grid" : "row"}
        onFiltersChange={filter.hide}
        renderActions={(product) => <AddToCartButton product={toProductRef(product)} />}
        renderOverlay={(product) => <WishlistButton productId={product.id} title={product.title} />}
      />

      <AnimatePresence mode="wait">
        {filter.backdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="filter-backdrop"
            className="backdrop z-[90]"
            onClick={filter.hide}
          />
        )}
      </AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t("filters")}
        initial={false}
        animate={
          filter.open
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

export default ProductsSection;
