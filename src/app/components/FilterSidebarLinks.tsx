"use client";
import { StoreContext } from "@/contexts/StoreContext";
import React, { useContext } from "react";
import { CategoryLinks } from "@/modules/catalog";

const FilterSidebarLinks = () => {
  const { filter } = useContext(StoreContext);
  return <CategoryLinks onSelect={filter.hideWholeFilterSidebar} />;
};

export default FilterSidebarLinks;
