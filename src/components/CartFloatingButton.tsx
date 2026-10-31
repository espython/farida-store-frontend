"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { Button } from "@nextui-org/react";
import React, { useContext, useMemo } from "react";
import { FaCartArrowDown } from "react-icons/fa6";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "./Icon";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/modules/cart";

const CartFloatingButton = () => {
  const { cartSidebar, cart, sidebar, searchBox } = useContext(StoreContext);
  const locale = useLocale();
  const t = useTranslations("header");
  const { totals, hydrated } = useCart();

  const movingValue = useMemo(() => {
    if (locale === "en") {
      return 1000;
    } else {
      return -1000;
    }
  }, [locale]);
  return (
    <AnimatePresence mode="wait">
      {!cartSidebar.showCartSideBar &&
        !cart.isCartMenuDisplayed &&
        !sidebar.showSideBar &&
        !searchBox.showSearchBox && (
          <motion.div
            initial={{ x: movingValue }}
            animate={{ x: 0 }}
            exit={{ x: movingValue }}
            transition={{
              duration: 1,
            }}
            className="hidden md:block fixed bottom-8 end-8 z-[100] w-max"
          >
            <Icon
              icon={<FaCartArrowDown className="text-cream text-xl md:text-2xl" aria-hidden="true" />}
              backColor="#1e3a2b"
              className="w-14 h-14 md:w-16 md:h-16 shadow-lg hover:opacity-90"
              showPop
              count={hydrated ? totals.itemCount : 0}
              label={t("cart")}
              whenClick={() => {
                cartSidebar.displayWholeCartSidebar();
              }}
            />
          </motion.div>
        )}
    </AnimatePresence>
  );
};

export default observer(CartFloatingButton);
