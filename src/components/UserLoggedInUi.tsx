"use client";
import React from "react";
import { AccountMenu } from "@/modules/customer";
import { useUserMenu } from "@/store/ui";

/** Header dropdown when signed in. */
const UserLoggedInUi = () => {
  const userDrop = useUserMenu();
  return <AccountMenu onNavigate={userDrop.hide} />;
};

export default UserLoggedInUi;
