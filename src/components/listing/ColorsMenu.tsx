"use client";
import React from "react";
import { ColorOptions } from "@/modules/catalog";
import { useDrawer } from "@/store/ui";

const ColorsMenu = () => {
  const filter = useDrawer("filters");
  return <ColorOptions onSelect={filter.hide} />;
};

export default ColorsMenu;
