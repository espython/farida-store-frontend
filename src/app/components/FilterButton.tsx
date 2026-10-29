"use client";
import { StoreContext } from "@/contexts/StoreContext";
import React, { useContext } from "react";
import { GiSettingsKnobs } from "react-icons/gi";
import { observer } from "mobx-react-lite";
import { IoMdClose } from "react-icons/io";
import { useTranslations } from "next-intl";

const FilterButton = () => {
  const { filter } = useContext(StoreContext);
  const t = useTranslations("filters");
  const open = filter.showFilterSideBar;

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={open ? filter.hideWholeFilterSidebar : filter.displayWholeFilterSidebar}
      className="flex items-center gap-2 h-11 px-5 rounded-full bg-garden text-cream font-semibold capitalize hover:bg-garden-600 transition-colors"
    >
      {open ? <IoMdClose className="text-lg" aria-hidden="true" /> : <GiSettingsKnobs className="text-lg" aria-hidden="true" />}
      {t("filter")}
    </button>
  );
};

export default observer(FilterButton);
