"use client";
import React, { useContext, useEffect, useState } from "react";
import { LiaNewspaper } from "react-icons/lia";
import { FaBackward, FaRegEye } from "react-icons/fa";
import { Button } from "@nextui-org/react";
import SafeDivider from "./SafeDivider";
import { StoreContext } from "@/contexts/StoreContext";
import { Link } from "@/navigation";
import { observer } from "mobx-react-lite";
import { useParams } from "next/navigation";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { IoMdClose } from "react-icons/io";
import { IoMdMenu } from "react-icons/io";
import { IoGridSharp } from "react-icons/io5";
import { FaBackwardStep } from "react-icons/fa6";
import { BsBack, BsBackspace } from "react-icons/bs";
import { BiLeftArrow } from "react-icons/bi";
import { MoveLeft } from "lucide-react";
import UserSidebarMenu from "./UserSidebarMenu";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";

const SidebarResponsiveContent = () => {
  const { sidebar, categories, user } = useContext(StoreContext);
  const { isLoggedIn } = useAuth();
  const tSidebar = useTranslations("sidebar");
  const tNavbar = useTranslations("navbar");
  const locale = useLocale();

  const mainMenu: { label: string; link: string }[] = [
    { label: tNavbar("home"), link: "/" },
    { label: tNavbar("products"), link: "/" },
    { label: tNavbar("order"), link: "/order" },
    { label: tNavbar("contact"), link: "/contact" },
  ];

  const urlParams: Params = useParams();

  const [editedParams, setEditedParam] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string>("main menu");

  const selectedButton = "bg-mainBlack text-mainWhite border-0";

  useEffect(() => {
    categories.getAllCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (urlParams.name) {
      setEditedParam(urlParams.name.replaceAll("%20", " "));
    }
  }, [urlParams]);
  return (
    <div className="relative flex md:hidden flex-col ">
      <div className="grid grid-cols-2 p-4 pb-0 gap-2 ">
        <Button
          disableAnimation
          radius="none"
          className={` border-2 border-solid border-mainBlack capitalize text-sm rounded-md bg-mainWhite text-mainBlack ${
            selectedLabel === "main menu" ? selectedButton : ""
          }`}
          startContent={<IoMdMenu className="text-xl" />}
          onClick={() => {
            setSelectedLabel("main menu");
          }}
        >
          {tSidebar("menu")}
        </Button>
        <Button
          disableAnimation
          radius="none"
          className={`  border-2 border-solid border-mainBlack capitalize text-sm  rounded-md bg-mainWhite text-mainBlack ${
            selectedLabel === "sections" ? selectedButton : ""
          }`}
          startContent={<IoGridSharp className="text-xl" />}
          onClick={() => {
            setSelectedLabel("sections");
          }}
        >
          {tSidebar("sections")}
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div
          className="flex items-start justify-center text-xl p-4"
          onClick={sidebar.hideWholeSidebar}
        >
          <MoveLeft className=" cursor-pointer" />
        </div>
        <div className="p-4">
          <h1 className="text-xl capitalize text-center">
            {/* Both labels are named literally rather than looked up
                dynamically: the state only ever holds "main menu" or
                "sections" (see the two setSelectedLabel calls above), and
                naming the keys is what lets the i18n verifier check them. If a
                third label is ever added this has to be revisited on purpose
                instead of dangling silently. */}
            {selectedLabel === "sections"
              ? tSidebar("sections")
              : tSidebar("menu")}
          </h1>
        </div>
      </div>

      <SafeDivider />

      {selectedLabel === "sections" ? (
        <>
          <div className="py-5 flex flex-col gap-3 capitalize px-5">
            {categories.categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.attributes.name}`}
                className={`side-link ${
                  editedParams === cat.attributes.name && `text-mainPink`
                }`}
                onClick={sidebar.hideWholeSidebar}
              >
                {locale === "en"
                  ? cat.attributes.name
                  : cat.attributes?.localizations?.data[0].attributes.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col ">
            <SafeDivider />
            <div className="flex py-3 flex-col px-5 gap-2 capitalize">
              <div className="flex items-center text-lg gap-2 text-mainBlack/50">
                <LiaNewspaper />
                <Link href={"/order"}>{tSidebar("order")}</Link>
              </div>
              <div className="flex items-center text-lg gap-2 text-mainBlack/50">
                <FaRegEye />
                <Link href={"#"}>{tSidebar("seen")}</Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="py-5 flex flex-col gap-3 capitalize px-5">
            {mainMenu.map((item) => (
              <Link
                key={item.label}
                href={item.link}
                className={`side-link ${
                  editedParams === item.label && `text-mainPink`
                }`}
                onClick={sidebar.hideWholeSidebar}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {isLoggedIn && <UserSidebarMenu />}
        </>
      )}
    </div>
  );
};

export default observer(SidebarResponsiveContent);
