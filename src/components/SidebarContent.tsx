"use client";
import React, { useContext } from "react";
import { IoMdClose } from "react-icons/io";
import { LiaNewspaper } from "react-icons/lia";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { StoreContext } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";
import { CategoryLinks } from "@/modules/catalog";
import BrandLogo from "@/shared/ui/BrandLogo";
import UserSidebarMenu from "./UserSidebarMenu";

const rowClass = "flex items-center gap-3 min-h-[44px] px-3 -mx-3 rounded-xl hover:bg-sand transition-colors";

/** The menu drawer: main links (hidden in the header below xl), categories, order tracking, account. */
const SidebarContent = () => {
  const { sidebar } = useContext(StoreContext);
  const { isLoggedIn } = useAuth();
  const t = useTranslations("sidebar");
  const nav = useTranslations("navbar");
  const header = useTranslations("header");
  const close = sidebar.hideWholeSidebar;

  const mainMenu = [
    { label: nav("home"), href: "/" },
    { label: nav("products"), href: "/" },
    { label: nav("order"), href: "/order" },
    { label: nav("contact"), href: "/contact" },
  ];

  return (
    <div className="flex flex-col min-h-full" suppressHydrationWarning={true}>
      <div className="sticky top-0 z-10 bg-cream flex items-center justify-between px-5 h-16 border-b border-line">
        <BrandLogo />
        <button
          type="button"
          onClick={close}
          aria-label={header("closeMenu")}
          className="w-11 h-11 grid place-items-center rounded-full hover:bg-sand"
        >
          <IoMdClose className="text-2xl" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label={t("menu")} className="px-5 py-4 xl:hidden">
        <p className="text-xs font-bold uppercase tracking-wider text-garden-muted mb-1">{t("menu")}</p>
        <ul className="flex flex-col capitalize font-semibold">
          {mainMenu.map((item) => (
            <li key={item.label}>
              <Link href={item.href} onClick={close} className={rowClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label={t("sections")} className="px-5 py-4 border-t border-line xl:border-t-0">
        <p className="text-xs font-bold uppercase tracking-wider text-garden-muted mb-1">{t("sections")}</p>
        <CategoryLinks onSelect={close} />
      </nav>

      <div className="px-5 py-4 border-t border-line">
        <Link href="/order" onClick={close} className={`${rowClass} capitalize`}>
          <LiaNewspaper className="text-xl" aria-hidden="true" />
          {t("order")}
        </Link>
      </div>

      {isLoggedIn && <UserSidebarMenu />}
    </div>
  );
};

export default observer(SidebarContent);
