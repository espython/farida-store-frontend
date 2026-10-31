import { useTranslations } from "next-intl";
import React from "react";
import { LuClock, LuMapPin, LuPhone } from "react-icons/lu";

interface branchProps {
  city_State: string;
  phone: string;
  times1: string;
  times2: string;
}

const Branch = ({ city_State, phone, times1, times2 }: branchProps) => {
  const t = useTranslations("contactPage");
  return (
    <ul className="flex flex-col gap-4">
      <li className="flex items-start gap-3">
        <LuMapPin aria-hidden="true" className="mt-1 shrink-0 text-garden" />
        <span>{city_State}</span>
      </li>
      <li className="flex items-start gap-3">
        <LuPhone aria-hidden="true" className="mt-1 shrink-0 text-garden" />
        <a href={`tel:${phone}`} className="font-semibold underline underline-offset-4" aria-label={`${t("branches.call")} ${phone}`}>
          <bdi>{phone}</bdi>
        </a>
      </li>
      <li className="flex items-start gap-3">
        <LuClock aria-hidden="true" className="mt-1 shrink-0 text-garden" />
        <span className="flex flex-col text-garden-muted">
          <span>{times1}</span>
          <span>{times2}</span>
        </span>
      </li>
    </ul>
  );
};

export default Branch;
