import React from "react";

interface MiniAdProps {
  content: string;
}

/** Promo band on category pages (Strapi mini ads until B5). */
const MiniAdCard = ({ content }: MiniAdProps) => {
  return (
    <div className="bg-saffron text-garden rounded-3xl px-6 py-8 md:py-10">
      <p className="text-center font-display text-xl md:text-[1.75rem] leading-snug">{content}</p>
    </div>
  );
};

export default MiniAdCard;
