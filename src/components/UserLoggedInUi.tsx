"use client";
import { StoreContext } from "@/contexts/StoreContext";
import React, { useContext, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { buttonClass } from "@/shared/ui/Button";
import { Button, Chip, Divider, User } from "@nextui-org/react";
import { IoMdLogOut } from "react-icons/io";
import { IoBagOutline } from "react-icons/io5";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "@/navigation";
import { RiUserSettingsLine } from "react-icons/ri";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

const UserLoggedInUi = () => {
  const { user } = useContext(StoreContext);

  const router = useRouter();
  const t = useTranslations("userLoggedIn");

  // const logout = () => {
  //     setIsLoading(true)
  //     signOut(auth).then(() => {
  //         setIsLoading(false)
  //     router.push("/login")
  //     }).catch((err) => {
  //         setIsLoading(false)
  //     })
  // }

  const logout = () => {
    user.isLoading = true;
    user.userLogout().then(() => {
      user.isLoading = false;
    });
    router.refresh();
    // router.push("/");
  };

  useEffect(() => {
    user.getUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full flex flex-col py-3">
      <div className="flex flex-col w-full">
        <Link href={"/user"} className="flex items-center px-5 py-3 hover:bg-sand">
          <User
            name={user.strapiUserdata?.username}
            description={user.strapiUserdata?.email}
            // avatarProps={{
            //   src: `${process.env.NEXT_PUBLIC_HOST}${user.strapiUserdata.avatar?.url}`,
            // }}
            className="lowercase justify-start"
            classNames={{ name: "font-bold text-garden", description: "text-garden-muted" }}
          />
        </Link>
        <Divider className="bg-line my-1" />
        <Link
          href={"/userorders"}
          className="flex items-center justify-between gap-2 px-5 min-h-[48px] hover:bg-sand"
        >
          <div className="flex gap-2 items-center ">
            <IoBagOutline />
            <h1>{t("orders")}</h1>
          </div>
          <div className="flex items-center gap-5">
            <Chip
              classNames={{
                base: "bg-saffron text-garden font-bold",
              }}
            >
              {/* {user.strapiUserdata.reviews.length} */}
              {user.strapiUserdata.order_details?.length}
            </Chip>
            <FaArrowRight className="text-sm rtl:rotate-180" aria-hidden="true" />
          </div>
        </Link>
        <Link
          href={"/userprofile"}
          className="flex items-center justify-between gap-2 px-5 min-h-[48px] hover:bg-sand"
        >
          <div className="flex gap-2 items-center">
            <RiUserSettingsLine />
            <h1>{t("profile")}</h1>
          </div>
          <div className="flex items-center gap-5">
            <FaArrowRight className="text-sm rtl:rotate-180" aria-hidden="true" />
          </div>
        </Link>

        <div>
          <Divider className="bg-line my-1" />
          <div className="flex pt-2 px-5 justify-center items-center">
            <Button
              //   endContent={

              //       <IoMdLogOut className='text-red-600'/>

              //     }
              radius="sm"
              isLoading={user.isLoading}
              className={`${buttonClass({ variant: "outline", full: true })} !border-[#b42318] !text-[#b42318] hover:!bg-[#b42318] hover:!text-white`}
              onClick={logout}
            >
              {t("logout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(UserLoggedInUi);
