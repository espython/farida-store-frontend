import { Link } from "@/navigation";
import React from "react";
import { LuChevronRight } from "react-icons/lu";

interface pageCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  pageLink: string;
}

const PageCard = ({ title, description, icon, pageLink }: pageCard) => {
  return (
    <Link
      href={pageLink}
      className="group h-full flex items-center gap-4 p-5 md:p-6 bg-white rounded-3xl border-2 border-transparent hover:border-garden transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-garden"
    >
      <span aria-hidden="true" className="w-14 h-14 shrink-0 grid place-items-center rounded-full bg-sand text-garden text-2xl">
        {icon}
      </span>
      <span className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="font-display text-xl first-letter:uppercase">{title}</span>
        <span className="text-sm text-garden-muted first-letter:uppercase">{description}</span>
      </span>
      <LuChevronRight aria-hidden="true" className="shrink-0 text-xl text-garden-muted rtl:rotate-180 group-hover:text-garden" />
    </Link>
  );
};

export default PageCard;
