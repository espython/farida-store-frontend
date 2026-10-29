"use client";
import React, { useContext, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import CartSideBarContent from "./CartSideBarContent";
import LoadingOverlay from "./LoadingOverlay";
import { useLocale } from "next-intl";

const CartSideBar = () => {
  const { cartSidebar } = useContext(StoreContext);

  const divRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();

  useEffect(() => {
    if (!cartSidebar.showCartSideBar) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cartSidebar.hideWholeCartSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartSidebar, cartSidebar.showCartSideBar]);

  return (
    <div className="relative max-w-screen h-auto ">
      <AnimatePresence mode="wait">
        {cartSidebar.showBackdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="backdrop z-[90]"
            onClick={cartSidebar.hideWholeCartSidebar}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={
          cartSidebar.showCartSideBar
            ? { x: 0, visibility: "visible" }
            : { x: locale === "en" ? "105%" : "-105%", transitionEnd: { visibility: "hidden" } }
        }
        transition={{
          type: "tween",
          duration: 0.5,
        }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!cartSidebar.showCartSideBar}
        className={`bg-cream text-garden w-[92vw] max-w-[26rem] h-[100dvh] fixed top-0 z-[100] shadow-xl ${
          locale === "en" ? "right-0 rounded-s-3xl" : "left-0 rounded-e-3xl"
        } overflow-hidden`}
        dir={locale === "en" ? "ltr" : "rtl"}
      >
        <CartSideBarContent />
      </motion.div>
    </div>
  );
};

export default observer(CartSideBar);
