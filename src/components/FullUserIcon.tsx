"use client";
import React, { useContext } from "react";
import Icon from "./Icon";
import { FaRegUser } from "react-icons/fa";
import UserDrop from "./UserDrop";

import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";

const FullUserIcon = () => {
  const { userDrop } = useContext(StoreContext);
  const t = useTranslations("header");
  return (
    <div
      className="relative"
      onMouseOver={userDrop.displayUserMenu}
      onMouseLeave={userDrop.hideUserMenu}
    >
      <Link href={`/login`} aria-label={t("account")}>
        <Icon icon={<FaRegUser />} hasBorder={true} />
      </Link>

      <UserDrop />
    </div>
  );
};

export default observer(FullUserIcon);
