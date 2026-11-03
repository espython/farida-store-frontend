"use client";
import React from "react";
import { IoMenuOutline } from "react-icons/io5";
import { useTranslations } from "next-intl";
import { useDrawer } from "@/store/ui";

const NavMenuIcon = () => {
  const sidebar = useDrawer("menu");
  const t = useTranslations("header");

  return (
    <button
      type="button"
      aria-label={t("menu")}
      onClick={sidebar.show}
      className="w-11 h-11 grid place-items-center rounded-full text-garden hover:bg-sand transition-colors shrink-0"
    >
      <IoMenuOutline size="1.5rem" aria-hidden="true" />
    </button>
  );
};

export default NavMenuIcon;
