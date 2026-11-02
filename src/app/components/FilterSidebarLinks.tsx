"use client";
import React from "react";
import { CategoryLinks } from "@/modules/catalog";
import { useDrawer } from "@/store/ui";

const FilterSidebarLinks = () => {
  const filter = useDrawer("filters");
  return <CategoryLinks onSelect={filter.hide} />;
};

export default FilterSidebarLinks;
