"use client";
import React, { useContext } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { ColorOptions } from "@/modules/catalog";

const ColorsMenu = () => {
  const { filter } = useContext(StoreContext);
  return <ColorOptions onSelect={filter.hideWholeFilterSidebar} />;
};

export default ColorsMenu;
