"use client";
import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import Icon from "./Icon";
import { StoreContext } from "@/contexts/StoreContext";
import { useTranslations } from "next-intl";

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
  const { searchBox } = useContext(StoreContext);
  const t = useTranslations("header");

  return (
    <Icon
      icon={<AiOutlineSearch className={className} />}
      hasBorder={hasBorder}
      hasBorderHover={hasBorderHover}
      whenClick={searchBox.displayWholeSearchBox}
      label={t("searchLabel")}
    />
  );
};

export default observer(FullSearchIcon);
