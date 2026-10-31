"use client";
import React, { useContext } from "react";
import { observer } from "mobx-react-lite";
import { StoreContext } from "@/contexts/StoreContext";
import { AccountMenu } from "@/modules/customer";

/** Header dropdown when signed in. */
const UserLoggedInUi = () => {
  const { userDrop } = useContext(StoreContext);
  return <AccountMenu onNavigate={userDrop.hideUserMenu} />;
};

export default observer(UserLoggedInUi);
