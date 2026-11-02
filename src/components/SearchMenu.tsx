"use client";
import React, { useEffect, useRef } from "react";
import { CgClose } from "react-icons/cg";
import SearchBox from "./SearchBox";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useDrawer } from "@/store/ui";

const SearchMenu = () => {
  const searchBox = useDrawer("search");
  const divRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("search");
  const locale = useLocale();

  useEffect(() => {
    if (!searchBox.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") searchBox.hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchBox, searchBox.open]);

  return (
    <div dir={locale === "en" ? "ltr" : "rtl"}>
      <AnimatePresence mode="wait">
        {searchBox.backdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="backdrop z-[90]"
            onClick={searchBox.hide}
          />
        )}
      </AnimatePresence>
      <motion.div
        ref={divRef}
        initial={false}
        animate={
          searchBox.open
            ? { y: 0, visibility: "visible" }
            : { y: "-110%", transitionEnd: { visibility: "hidden" } }
        }
        transition={{
          type: "tween",
          duration: 0.5,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-dialog-title"
        aria-hidden={!searchBox.open}
        className="bg-cream fixed top-0 inset-x-0 h-full md:h-auto md:max-h-[85vh] md:rounded-b-3xl shadow-xl text-garden z-[100] overflow-y-auto"
      >
        <div className="max-w-[860px] mx-auto px-4 md:px-8 py-4 md:py-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p id="search-dialog-title" className="font-display text-2xl md:text-[2rem] capitalize">
              {t("search")}
            </p>
            <button
              type="button"
              onClick={searchBox.hide}
              aria-label={t("close")}
              className="w-11 h-11 grid place-items-center rounded-full bg-white hover:bg-sand"
            >
              <CgClose className="text-xl" aria-hidden="true" />
            </button>
          </div>
          <SearchBox />
        </div>
      </motion.div>
    </div>
  );
};

export default SearchMenu;
