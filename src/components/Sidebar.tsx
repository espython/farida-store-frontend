"use client";
import { StoreContext } from "@/contexts/StoreContext";
import React, { useContext, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import SidebarContent from "./SidebarContent";
import { useLocale, useTranslations } from "next-intl";

const Sidebar = () => {
  const { sidebar } = useContext(StoreContext);

  const divRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();
  const t = useTranslations("sidebar");

  useEffect(() => {
    if (!sidebar.showSideBar) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") sidebar.hideWholeSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebar, sidebar.showSideBar]);

  return (
    <div className="relative w-full h-auto">
      <AnimatePresence mode="wait">
        {sidebar.showBackdrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="backdrop z-[90]"
            onClick={sidebar.hideWholeSidebar}
          />
        )}
      </AnimatePresence>
      <motion.div
        ref={divRef}
        initial={false}
        animate={
          sidebar.showSideBar
            ? { x: 0, visibility: "visible" }
            : { x: locale === "en" ? "-105%" : "105%", transitionEnd: { visibility: "hidden" } }
        }
        transition={{
          type: "tween",
          duration: 0.5,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        aria-hidden={!sidebar.showSideBar}
        className={`bg-cream text-garden h-[100dvh] w-[88vw] max-w-[22rem] fixed top-0 ${
          locale === "en" ? "left-0 rounded-e-3xl" : "right-0 rounded-s-3xl"
        } z-[100] overflow-auto shadow-xl`}
        dir={locale === "en" ? "ltr" : "rtl"}
      >
        <SidebarContent />
      </motion.div>
    </div>
  );
};

export default observer(Sidebar);
