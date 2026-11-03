"use client";
import React from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslations } from "next-intl";

interface MiniActiveFilterProps {
  filterTitle: string;
  /** URL search param removed by the chip's button. */
  filterName: string;
  deleteFilter: (filter: string) => void;
}

const MiniActiveFilter = ({ filterTitle, filterName, deleteFilter }: MiniActiveFilterProps) => {
  const t = useTranslations("activeFilters");
  return (
    <span className="inline-flex items-center gap-1 h-9 ps-4 pe-1 rounded-full bg-garden text-cream text-sm font-semibold">
      {filterTitle}
      <button
        type="button"
        onClick={() => deleteFilter(filterName)}
        aria-label={`${t("remove")} ${filterTitle}`}
        className="w-8 h-8 grid place-items-center rounded-full hover:bg-garden-600"
      >
        <IoMdClose aria-hidden="true" />
      </button>
    </span>
  );
};

export default MiniActiveFilter;
