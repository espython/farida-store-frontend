"use client";
import React, { useContext } from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";
import Icon from "./Icon";

// import CartDrop from "./Cartdrop";
import CartDrop2 from "./Cartdrop";

import { observer } from "mobx-react-lite";

import { StoreContext } from "@/contexts/StoreContext";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/modules/cart";

const FullCartIcon = () => {
  const { cart } = useContext(StoreContext);
  const t = useTranslations("header");
  const { totals, hydrated } = useCart();
  const count = hydrated ? totals.itemCount : 0;

  return (
    <div className="relative" onMouseOver={cart.displayCartMenu} onMouseLeave={cart.hideCartMenu}>
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

export default observer(FullCartIcon);
