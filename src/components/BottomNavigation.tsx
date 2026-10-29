"use client";
import React, { useContext } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import { StoreContext } from "@/contexts/StoreContext";

const tabClass = (active: boolean) =>
  `flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-xs font-semibold ${
    active ? "text-saffron" : "text-cream"
  }`;

const Glyph = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  home: "M3 11 12 4l9 7v9h-6v-6H9v6H3z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  wishlist:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
};

/** Phone-only floating tab bar (Kitchen Garden). */
const BottomNavigation = () => {
  const t = useTranslations("bottomNav");
  const pathname = usePathname();
  const { searchBox } = useContext(StoreContext);

  const tab = (href: string, key: keyof typeof ICONS, active: boolean): ReactNode => (
    <Link href={href} className={tabClass(active)} aria-current={active ? "page" : undefined}>
      <Glyph d={ICONS[key]} />
      {t(key)}
    </Link>
  );

  return (
    <nav
      aria-label={t("label")}
      className="md:hidden fixed bottom-3 inset-x-3 z-[85] h-16 rounded-full bg-garden shadow-lg grid grid-cols-4"
    >
      {tab("/", "home", pathname === "/")}
      <button type="button" className={tabClass(false)} onClick={searchBox.displayWholeSearchBox}>
        <Glyph d={ICONS.search} />
        {t("search")}
      </button>
      {tab("/wishlist", "wishlist", pathname.startsWith("/wishlist"))}
      {tab("/user", "account", pathname.startsWith("/user"))}
    </nav>
  );
};

export default observer(BottomNavigation);
