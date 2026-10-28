import React, { type ReactNode } from "react";
import { AiOutlineGlobal } from "react-icons/ai";
import { RiExchangeDollarLine } from "react-icons/ri";
import { MdOutlinePayment } from "react-icons/md";
import BestSellerMenu from "./BestSellerMenu";
import { useTranslations } from "next-intl";

interface InformationSectionProps {
  /** Best-seller list; defaults to the Strapi one. */
  bestSellers?: ReactNode;
}

const InformationSection = ({ bestSellers = <BestSellerMenu /> }: InformationSectionProps) => {
  const t = useTranslations("productPage");
  return (
    <div className="flex flex-col gap-5 order-3 md:order-none ">
      <div className="w-full  h-auto md:aspect-square bg-mainDarkBlue p-3 flex justify-center items-center">
        <div className="w-full h-full  py-20 md:py-0 border-1 border-mainWhite border-dashed  capitalize  flex flex-col justify-center items-center gap-2">
          <h1 className="text-white font-bold text-lg md:text-xl text-center">
            {t("information.elevate")}
          </h1>
          <h1 className="text-white text-xs md:text-sm text-center">
            {t("information.quality")}
          </h1>
          <h1 className="text-white text-xs md:text-sm underline text-center">
            {t("information.farida")}
          </h1>
        </div>
      </div>
      <div className="w-full h-auto bg-mainGray capitalize p-3 flex flex-col gap-5">
        <div className="grid grid-cols-[auto_1fr] items-start  gap-2">
          <AiOutlineGlobal className="text-xs md:text-lg" />
          <h1 className="text-xs md:text-sm"> {t("information.shipping")}</h1>
        </div>
        <div className="grid grid-cols-[auto_1fr] items-start  gap-2">
          <RiExchangeDollarLine className="text-xs md:text-lg" />
          <h1 className="text-xs md:text-sm">{t("information.exchange")}</h1>
        </div>
        <div className="grid grid-cols-[auto_1fr] items-start  gap-2">
          <MdOutlinePayment className="text-xs md:text-lg" />
          <h1 className="text-xs md:text-sm">{t("information.payments")}</h1>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="capitalize text-lg md:text-xl">{t("bestSeller")}</h1>
        {bestSellers}
      </div>
    </div>
  );
};

export default InformationSection;
