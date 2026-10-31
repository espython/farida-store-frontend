"use client";
import { useAuth } from "@/hooks/useAuth";
import { Button, Chip, User } from "@nextui-org/react";
import React, { useContext } from "react";
import { FaArrowRight, FaRegUserCircle } from "react-icons/fa";
import UserLoggedInUi from "./UserLoggedInUi";
import { IoBagOutline } from "react-icons/io5";
import { Link } from "@/navigation";
import { RiUserSettingsLine } from "react-icons/ri";
import { IoIosLogOut } from "react-icons/io";
import { useRouter } from "@/navigation";

import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { useTranslations } from "next-intl";

const UserSidebarMenu = () => {
  const { user, sidebar } = useContext(StoreContext);

  const router = useRouter();
  const t = useTranslations("userLoggedIn");

  const logout = () => {
    user.isLoading = true;
    user.userLogout().then(() => {
      user.isLoading = false;
    });
    sidebar.hideWholeSidebar();
    router.refresh();
    // router.push("/");
  };

  const row = "flex items-center justify-between gap-2 min-h-[44px] px-3 -mx-3 rounded-xl hover:bg-sand transition-colors";

  return (
    <div className="px-5 py-4 border-t border-line flex flex-col">
      <Link href={"/user"} onClick={sidebar.hideWholeSidebar} className={`${row} py-2`}>
        <User
          name={user.strapiUserdata?.username}
          description={user.strapiUserdata?.email}
          className="lowercase justify-start"
          classNames={{ name: "font-bold text-garden", description: "text-garden-muted" }}
        />
      </Link>
      <Link href={"/userorders"} className={row} onClick={sidebar.hideWholeSidebar}>
        <span className="flex gap-3 items-center">
          <IoBagOutline aria-hidden="true" />
          {t("orders")}
        </span>
        <Chip size="sm" classNames={{ base: "bg-saffron text-garden font-bold" }}>
          {user.strapiUserdata.order_details?.length ?? 0}
        </Chip>
      </Link>
      <Link href={"/userprofile"} className={row} onClick={sidebar.hideWholeSidebar}>
        <span className="flex gap-3 items-center">
          <RiUserSettingsLine aria-hidden="true" />
          {t("profile")}
        </span>
      </Link>
      <button type="button" onClick={logout} className={`${row} text-[#b42318] font-semibold`}>
        <span className="flex gap-3 items-center">
          <IoIosLogOut aria-hidden="true" />
          {t("logout")}
        </span>
      </button>
    </div>
  );
};

export default observer(UserSidebarMenu);
