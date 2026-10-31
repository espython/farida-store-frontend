"use client";
import { Link } from "@/navigation";
import React, { useContext } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/navigation";
import { StoreContext } from "@/contexts/StoreContext";

interface colorProps {
  value: string;
  name: string;
  hex: string;
}

const ColorChoice = ({ value, name, hex }: colorProps) => {
  const { filter } = useContext(StoreContext);

  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();

  const params = new URLSearchParams(searchParams);

  // const salesOnly = searchParams.get("salesonly")

  const colorFilter = searchParams.get("color");

  const handleColorSearch = (param: string) => {
    if (param) {
      params.set("color", param);
    } else {
      params.delete("color");
    }
    router.replace(`${pathname}?${params.toString()}`);

    filter.hideWholeFilterSidebar();
  };

  return (
    <button
      type="button"
      aria-pressed={colorFilter === value}
      onClick={() => {
        handleColorSearch(value ?? "");
      }}
      className={`inline-flex items-center gap-2 h-11 ps-2 pe-4 rounded-full bg-white border-2 font-semibold transition-colors ${
        colorFilter === value ? "border-garden" : "border-transparent hover:border-line"
      }`}
    >
      <span className="w-7 h-7 rounded-full border border-black/10" style={{ backgroundColor: `${hex}` }} />
      {name}
      {colorFilter === value && <span aria-hidden="true">✓</span>}
    </button>
  );
};

export default ColorChoice;
