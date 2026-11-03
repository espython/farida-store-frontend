"use client";
import React from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslations } from "next-intl";
import FilterSidebarLinks from "./FilterSidebarLinks";
import PriceSlider from "./PriceSlider";
import ColorsMenu from "./ColorsMenu";
import { buttonClass } from "@/shared/ui/Button";
import { useDrawer } from "@/store/ui";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3 px-5 py-5 border-b border-line last:border-b-0">
    <h2 className="font-display text-lg capitalize">{title}</h2>
    {children}
  </section>
);

/** Filter drawer: categories, price, colours; filters apply as they change. */
const FilterSidebarContents = () => {
  const filter = useDrawer("filters");
  const t = useTranslations("filters");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
        <p className="font-display text-xl capitalize">{t("filters")}</p>
        <button
          type="button"
          onClick={filter.hide}
          aria-label={t("close")}
          className="w-11 h-11 grid place-items-center rounded-full hover:bg-sand"
        >
          <IoMdClose className="text-2xl" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Section title={t("category")}>
          <FilterSidebarLinks />
        </Section>
        <Section title={t("price")}>
          <PriceSlider />
        </Section>
        <Section title={t("colors")}>
          <ColorsMenu />
        </Section>
      </div>
      <div className="p-5 border-t border-line bg-white shrink-0">
        <button type="button" className={`${buttonClass({ full: true })} capitalize`} onClick={filter.hide}>
          {t("showResults")}
        </button>
      </div>
    </div>
  );
};

export default FilterSidebarContents;
