"use client";
import React, { ReactElement } from "react";
import { IconType } from "react-icons/lib";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";

type color =
  | "mainPink"
  | "mainWhite"
  | "mainDarkBlue"
  | "mainBlack"
  | "mainGray"
  | "transparent";

interface iconProps {
  color?: color;
  backColor?: string;
  hasBorder?: boolean;
  hasBorderHover?: boolean;
  borderColor?: color;
  borderSize?: "1" | "2" | "3" | "4" | "5" | "8";
  count?: number;
  showPop?: boolean;
  icon: ReactElement<IconType>;
  className?: string;
  whenClick?: () => void;
  /** Accessible name; icon-only buttons need one. */
  label?: string;
}

/** Round 44 px icon button of the Kitchen Garden header, with an optional count badge. */
const Icon = ({
  icon,
  color,
  hasBorder = false,
  count = 0,
  showPop = false,
  backColor,
  whenClick,
  className = "",
  label,
}: iconProps) => {
  return (
    <div
      className={`relative grid place-items-center w-11 h-11 rounded-full text-xl transition-colors cursor-pointer ${
        color ? `text-${color}` : "text-garden"
      } ${backColor ? "" : "bg-white hover:bg-sand"} ${hasBorder ? "ring-1 ring-line" : ""} ${className}`}
      onClick={whenClick}
      role={whenClick ? "button" : undefined}
      tabIndex={whenClick ? 0 : undefined}
      aria-label={label}
      onKeyDown={
        whenClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                whenClick();
              }
            }
          : undefined
      }
      style={backColor ? { backgroundColor: backColor } : undefined}
    >
      {showPop && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: count > 0 ? 1 : 0 }}
          className="absolute -top-1 -end-1 min-w-[1.125rem] h-[1.125rem] px-1 grid place-items-center rounded-full bg-saffron text-garden text-[0.6875rem] font-bold"
        >
          {count}
        </motion.span>
      )}

      {icon}
    </div>
  );
};

export default observer(Icon);
