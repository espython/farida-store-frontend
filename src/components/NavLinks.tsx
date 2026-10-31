import { useTranslations } from "next-intl";
// import Link from "next/link";
import { Link } from "@/navigation";
import React from "react";

const NavLinks2 = () => {
  const t = useTranslations("navbar");

  return (
    <nav aria-label={t("label")} className="capitalize hidden xl:flex shrink-0 text-base font-semibold">
      <div className="flex items-center gap-6">
        <Link href={"/"} className="nav-link">
          {t("home")}
        </Link>
        <Link href={"/"} className="nav-link">
          {t("products")}
        </Link>
        <Link href={"/order"} className="nav-link">
          {t("order")}
        </Link>
        <Link href={"/contact"} className="nav-link">
          {t("contact")}
        </Link>
      </div>
    </nav>
  );
};

export default NavLinks2;
