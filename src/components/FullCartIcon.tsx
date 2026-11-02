"use client";
import React from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";
import Icon from "./Icon";

// import CartDrop from "./Cartdrop";
import CartDrop2 from "./Cartdrop";


import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/modules/cart";
import { useCartMenu, useDrawer } from "@/store/ui";

const FullCartIcon = () => {
  const cartSidebar = useDrawer("cart");
  const cartMenu = useCartMenu();
  const t = useTranslations("header");
  const { totals, hydrated } = useCart();
  const count = hydrated ? totals.itemCount : 0;

  return (
    <div className="relative" onMouseOver={cartMenu.show} onMouseLeave={cartMenu.hide}>
      <Link href={"/cart"} aria-label={`${t("cart")} (${count})`}>
        <Icon
          icon={<AiOutlineShoppingCart />}
          hasBorder={true}
          showPop={true}
          count={count}
        />
      </Link>

      <CartDrop2 />
    </div>
  );
};

export default FullCartIcon;
