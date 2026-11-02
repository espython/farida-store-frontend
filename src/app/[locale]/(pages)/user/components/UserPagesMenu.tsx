"use client";
import React, { useEffect } from "react";
import PageCard from "./PageCard";
import { LuHeart, LuMapPin, LuPackage, LuShoppingCart, LuUserCog } from "react-icons/lu";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";

const UserPagesMenu = () => {
  const { isLoggedIn } = useAuth();
  const t = useTranslations("userPage");

  const router = useRouter();

  const pagesCards = [
    {
      id: 1,
      title: t("title.orders"),
      description: t("description.orders"),
      icon: <LuPackage />,
      pageLink: `/userorders`,
    },
    {
      id: 2,
      title: t("title.profile"),
      description: t("description.profile"),
      icon: <LuUserCog />,
      pageLink: `/userprofile`,
    },
    {
      id: 3,
      title: t("title.addresses"),
      description: t("description.addresses"),
      icon: <LuMapPin />,
      pageLink: `/useraddresses`,
    },
    // {
    //   id: 4,
    //   title: "your payments",
    //   description:
    //     "view all transactions , manage payment methods and settings",
    //   icon: <MdPayment />,
    //   pageLink: "#",
    // },
    {
      id: 5,
      title: t("title.cart"),
      description: t("description.cart"),
      icon: <LuShoppingCart />,
      pageLink: `/cart`,
    },
    {
      id: 6,
      title: t("title.wishlist"),
      description: t("description.wishlist"),
      icon: <LuHeart />,
      pageLink: `/wishlist`,
    },
  ];

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {pagesCards.map((card) => (
        <li key={card.id}>
          <PageCard
            title={card.title}
            description={card.description}
            icon={card.icon}
            pageLink={card.pageLink}
          />
        </li>
      ))}
    </ul>
  );
};

export default UserPagesMenu;
