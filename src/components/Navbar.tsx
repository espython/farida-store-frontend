"use client";
import React from "react";
import NavIcons from "./NavIcons";
import NavLinks from "./NavLinks";
import NavMenuIcon from "./NavMenuIcon";
import SearchMenu from "./SearchMenu";
import BrandLogo from "@/shared/ui/BrandLogo";
import HeaderSearch from "@/shared/ui/HeaderSearch";

/** Kitchen Garden header: 56 px on phones (search on its own row), 72 px from md up. */
const NavBar = () => {
  return (
    <>
      <SearchMenu />
      <header className="sticky top-0 z-[80] bg-cream/95 backdrop-blur border-b border-line">
        <div className="max-w-[1280px] mx-auto h-14 md:h-[72px] px-2 md:px-8 flex items-center gap-3 md:gap-8">
          <NavMenuIcon />
          <BrandLogo className="shrink-0" />
          <NavLinks />
          <HeaderSearch id="header-search" className="hidden md:flex flex-1" />
          <NavIcons />
        </div>
        <div className="md:hidden px-4 pb-3">
          <HeaderSearch id="header-search-mobile" />
        </div>
      </header>
    </>
  );
};

export default NavBar;
