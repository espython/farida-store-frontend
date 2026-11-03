"use client";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CartSideBarContent from "./CartSideBarContent";
import LoadingOverlay from "./LoadingOverlay";
import { useLocale } from "next-intl";
import { useDrawer } from "@/store/ui";

const CartSideBar = () => {
  const cartSidebar = useDrawer("cart");

  const divRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();

  useEffect(() => {
    if (!cartSidebar.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cartSidebar.hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartSidebar, cartSidebar.open]);

  return (
    <div className="relative max-w-screen h-auto ">
      <AnimatePresence mode="wait">
        {cartSidebar.backdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="backdrop z-[90]"
            onClick={cartSidebar.hide}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={
          cartSidebar.open
            ? { x: 0, visibility: "visible" }
            : { x: locale === "en" ? "105%" : "-105%", transitionEnd: { visibility: "hidden" } }
        }
        transition={{
          type: "tween",
          duration: 0.5,
        }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!cartSidebar.open}
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

export default CartSideBar;
