"use client";
import React from "react";

interface productTypeLabelProps {
  title: string;

  classNames?: {
    title?: string;
    container?: string;
  };
}

const ProductTypeLabel = ({ title, classNames }: productTypeLabelProps) => {
  return (
    <div
      className={`px-3 py-0.5 rounded-full capitalize z-20 text-[0.8125rem] font-bold flex justify-center items-center ${
        classNames?.container ?? "bg-saffron text-garden"
      }`}
    >
      <span className={`text-center ${classNames?.title ?? ""}`}>{title}</span>
    </div>
  );
};

export default ProductTypeLabel;
