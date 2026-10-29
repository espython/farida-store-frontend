"use client";
import React, { useEffect, useState } from "react";
import { FaLongArrowAltUp } from "react-icons/fa";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const GoTopFloatingButton = () => {
  const [screenScrollY, setScreenScrollY] = useState(0);
  const [pageHeight, setPageHeight] = useState(1000);
  const t = useTranslations("goTop");
  const goTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const scrolling = () => {
      setScreenScrollY(scrollY);
    };

    window.addEventListener("scroll", scrolling);

    return () => {
      window.removeEventListener("scroll", scrolling);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPageHeight(document.body.offsetHeight);
    }
  }, []);

  const shown = screenScrollY > (1 / 2) * pageHeight;

  return (
    <motion.button
      type="button"
      aria-label={t("top")}
      initial={false}
      animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : 0.6 }}
      style={{ pointerEvents: shown ? "auto" : "none" }}
      tabIndex={shown ? 0 : -1}
      className="fixed z-[70] w-11 h-11 grid place-items-center rounded-full bg-white text-garden shadow-lg border border-line hover:bg-sand bottom-24 start-4 md:start-auto md:bottom-28 md:end-9"
      onClick={goTop}
    >
      <FaLongArrowAltUp aria-hidden="true" />
    </motion.button>
  );
};

export default GoTopFloatingButton;
