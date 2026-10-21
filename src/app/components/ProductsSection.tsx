"use client";
import React, { useContext, useEffect, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductsPagination from "./ProductsPagination";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { CircularProgress, Spinner } from "@nextui-org/react";

import { AnimatePresence, motion } from "framer-motion";
import FilterSidebarContents from "@/app/components/FilterSidebarContents";
import RawProductCard from "./RawProductCard";
import GridStyleView from "./GridStyleView";
import RowStyleView from "./RowStyleView";
import { useLocale } from "next-intl";
import { CATALOG_SOURCE, CatalogListing } from "@/modules/catalog";

const ProductsSection = () => {
  const { products, viewStyle, filter } = useContext(StoreContext);

  const divRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  return (
    <div className="flex flex-col  gap-5 relative ">
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
            key="white-backdrop"
            className="bg-mainWhite/50 w-full h-full absolute top-0 left-0 z-50"
            onClick={filter.hideWholeFilterSidebar}
          />
        )}
      </AnimatePresence>
      <div
        className={`absolute ${
          filter.showBackdrop && "w-full h-full"
        }  overflow-hidden  ${
          filter.showFilterSideBar ? "overflow-y-auto" : "overflow-y-hidden"
        } `}
      >
        <motion.div
          ref={divRef}
          initial={{ x: locale === "en" ? -1500 : 1500 }}
          animate={{
            x: filter.showFilterSideBar
              ? 0
              : locale === "en" && divRef.current?.offsetHeight
              ? -divRef.current?.offsetHeight
              : divRef.current?.offsetHeight,
          }}
          // exit={{
          //   x: divRef.current?.offsetHeight
          //     ? -divRef.current?.offsetHeight
          //     : -1500,
          // }}
          transition={{
            type: "tween",
            duration: 0.5,
          }}
          className={`absolute top-0 ${
            locale === "en" ? "left-0" : "right-0"
          }  bg-mainWhite  h-auto w-full md:w-auto z-50   `}
        >
          <FilterSidebarContents />
        </motion.div>
      </div>

      {/* <div
        key="white-cover-rectangle"
        className="bg-mainWhite w-10  h-full absolute top-0 left-0 z-[60] hidden md:block"
      /> */}
    </div>
  );
};

export default observer(ProductsSection);
