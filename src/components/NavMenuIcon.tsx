"use client";
import React, { useContext } from "react";
import { IoMenuOutline } from "react-icons/io5";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";

const NavMenuIcon = () => {
  const { sidebar } = useContext(StoreContext);
  const t = useTranslations("header");

  return (
    <button
      type="button"
      aria-label={t("menu")}
      onClick={sidebar.displayWholeSidebar}
      className="xl:hidden w-11 h-11 grid place-items-center rounded-full text-garden hover:bg-sand transition-colors shrink-0"
    >
      <IoMenuOutline size="1.5rem" aria-hidden="true" />
    </button>
  );
};

export default observer(NavMenuIcon);
