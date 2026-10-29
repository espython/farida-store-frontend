"use client";
import React, { useContext } from "react";

import FullCartIcon from "./FullCartIcon";
import FullUserIcon from "./FullUserIcon";

import { observer } from "mobx-react-lite";

import FullWishlistIcon from "./FullWishlistIcon";
import LanguageIcon from "./LanguageIcon";

const NavIcons = () => {
  return (
    <div className="ms-auto flex items-center gap-1.5 md:gap-2 shrink-0">
      <div className="hidden md:flex items-center gap-2">
        <FullUserIcon />
        <FullWishlistIcon />
      </div>
      <FullCartIcon />
      <LanguageIcon />
    </div>
  );
};

export default observer(NavIcons);
