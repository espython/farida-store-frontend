"use client";
import React from "react";
import Icon from "./Icon";
import { FaRegUser } from "react-icons/fa";
import UserDrop from "./UserDrop";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useUserMenu } from "@/store/ui";

const FullUserIcon = () => {
  const userDrop = useUserMenu();
  const t = useTranslations("header");
  return (
    <div
      className="relative"
      onMouseOver={userDrop.show}
      onMouseLeave={userDrop.hide}
    >
      <Link href={`/login`} aria-label={t("account")}>
        <Icon icon={<FaRegUser />} hasBorder={true} />
      </Link>

      <UserDrop />
    </div>
  );
};

export default FullUserIcon;
