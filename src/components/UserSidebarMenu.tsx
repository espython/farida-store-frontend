"use client";
import React, { useContext } from "react";
import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { AccountMenu } from "@/modules/customer";

/** Account section of the menu drawer when signed in. */
const UserSidebarMenu = () => {
  const { sidebar } = useContext(StoreContext);
  return (
    <div className="px-5 py-4 border-t border-line">
      <AccountMenu variant="drawer" onNavigate={sidebar.hideWholeSidebar} />
    </div>
  );
};

export default observer(UserSidebarMenu);
