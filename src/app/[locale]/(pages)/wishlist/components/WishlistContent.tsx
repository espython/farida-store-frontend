"use client";
import React, { useContext, useId } from "react";
import WishListItem from "./WishListItem";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import WishListIsEmpty from "./WishListIsEmpty";
import { useTranslations } from "next-intl";

const SORTS = [
  { value: "Rating", key: "rating" },
  { value: "Prices Up", key: "pricesUp" },
  { value: "Prices Down", key: "pricesDown" },
  { value: "A-Z", key: "AZ" },
] as const;

const WishlistContent = () => {
  const { userWishlist } = useContext(StoreContext);
  const t = useTranslations("wishList");
  const sortId = useId();

  if (userWishlist.userWishlistProductsCount === 0) return <WishListIsEmpty />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-garden-muted">
          {t("content.count", { count: userWishlist.userWishlistProducts.length })}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor={sortId} className="text-sm font-semibold">
            {t("content.filters.sortBy")}
          </label>
          <select
            id={sortId}
            defaultValue=""
            onChange={(e) => e.target.value && userWishlist.sortUserWishlistItems(e.target.value)}
            className="h-11 rounded-full bg-white border border-line px-4 pe-8 text-garden focus:border-garden focus:outline-none focus:ring-2 focus:ring-garden/20"
          >
            <option value="" disabled>
              {t("content.filters.choose")}
            </option>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {t(`content.filters.${s.key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6">
        {userWishlist.userWishlistProducts.map((item) => (
          <li key={item.id}>
            <WishListItem product={item} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default observer(WishlistContent);
