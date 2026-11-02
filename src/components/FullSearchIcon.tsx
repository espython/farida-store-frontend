"use client";
import React from "react";
import { AiOutlineSearch } from "react-icons/ai";
import Icon from "./Icon";
import { useTranslations } from "next-intl";
import { useDrawer } from "@/store/ui";

interface fullUserSearchIconProps {
  className?: string;
  hasBorder?: boolean;
  hasBorderHover?: boolean;
}

const FullSearchIcon = ({
  className,
  hasBorder = true,
  hasBorderHover = true,
}: fullUserSearchIconProps) => {
  const searchBox = useDrawer("search");
  const t = useTranslations("header");

  return (
    <Icon
      icon={<AiOutlineSearch className={className} />}
      hasBorder={hasBorder}
      hasBorderHover={hasBorderHover}
      whenClick={searchBox.show}
      label={t("searchLabel")}
    />
  );
};

export default FullSearchIcon;
