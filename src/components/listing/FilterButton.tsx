"use client";
import React from "react";
import { GiSettingsKnobs } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import { useTranslations } from "next-intl";
import { useDrawer } from "@/store/ui";

const FilterButton = () => {
  const filter = useDrawer("filters");
  const t = useTranslations("filters");
  const open = filter.open;

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={open ? filter.hide : filter.show}
      className="flex items-center gap-2 h-11 px-5 rounded-full bg-garden text-cream font-semibold capitalize hover:bg-garden-600 transition-colors"
    >
      {open ? <IoMdClose className="text-lg" aria-hidden="true" /> : <GiSettingsKnobs className="text-lg" aria-hidden="true" />}
      {t("filter")}
    </button>
  );
};

export default FilterButton;
