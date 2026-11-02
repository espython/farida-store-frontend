"use client";
import React from "react";
import { AccountMenu } from "@/modules/customer";
import { useDrawer } from "@/store/ui";

/** Account section of the menu drawer when signed in. */
const UserSidebarMenu = () => {
  const sidebar = useDrawer("menu");
  return (
    <div className="px-5 py-4 border-t border-line">
      <AccountMenu variant="drawer" onNavigate={sidebar.hide} />
    </div>
  );
};

export default UserSidebarMenu;
