"use client";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StoreContext } from "@/contexts/StoreContext";
import { getAverageRatings } from "@/functions/getAverageRatings";
import { userWishlistProductType } from "@/stores/specificTypes/wishlistProductType";
import { Image } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { Link } from "@/navigation";
import React, { useContext, useState } from "react";
import { LuCheck, LuShoppingCart, LuX } from "react-icons/lu";
import { useLocale, useTranslations } from "next-intl";
import { formatAmount } from "@/shared/lib/price";
import Button from "@/shared/ui/Button";

interface wishlistItemProps {
  product: userWishlistProductType;
}

/** Wishlist entry in the product card look: 1:1 image, remove button, title, price, add to cart. */
const WishListItem = ({ product }: wishlistItemProps) => {
  const { userWishlist, user, cart } = useContext(StoreContext);

  const [isLoading, setIsloading] = useState(false);
  const t = useTranslations("wishList");
  const currency = useTranslations("currency");
  const locale = useLocale();

  const inCart = Boolean(cart.isInUserCart(Number(product.id)));
  const title = locale === "en" ? product.title : product.localization.title;
  // The count came from products.targetProductReviews, i.e. whichever
  // product page was opened last, not this product.
  const reviewCount = (product.reviews ?? []).filter((r) => r.allowed).length;
  const average = reviewCount > 0 ? getAverageRatings(product.reviews) : 0;
  const href = `/product/${product.id}`;

  const addToCart = () => {
    setIsloading(true);
    user.addProductToUserCart(product.id, 1).then(() => {
      cart.setProductsCount = cart.productsCount + 1;
      setIsloading(false);
    });
  };
  const removeFromWishlist = () => {
    setIsloading(true);
    userWishlist
      .removeProductFromUserWishlistByProductId(product.id)
      .then(() => {
        userWishlist.setUserWishlistProductCount =
          userWishlist.userWishlistProductsCount - 1;
        setIsloading(false);
      });
  };

  return (
    <article className="relative flex flex-col gap-3 h-full">
      {isLoading && <LoadingOverlay />}
      <div className="relative aspect-square rounded-[20px] overflow-hidden bg-sand">
        <Link href={href} className="block w-full h-full" tabIndex={-1} aria-hidden="true">
          <Image
            src={product.imgSrc}
            alt=""
            radius="none"
            removeWrapper
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
          />
        </Link>
        <button
          type="button"
          onClick={removeFromWishlist}
          aria-label={t("content.item.remove", { title })}
          className="absolute z-20 top-2 end-2 w-11 h-11 grid place-items-center rounded-full bg-white/90 text-garden hover:bg-white hover:text-[#b42318] focus-visible:outline focus-visible:outline-2 focus-visible:outline-garden"
        >
          <LuX aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <h2 className="text-base md:text-[1.0625rem] font-semibold leading-snug line-clamp-2 min-h-[2.75em]">
          <Link href={href} className="hover:text-saffron-ink transition-colors">
            {title}
          </Link>
        </h2>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg md:text-xl font-bold">
            {formatAmount(product.price)} <span className="text-sm font-semibold">{currency("currency")}</span>
          </span>
          {reviewCount > 0 && (
            <span className="text-sm text-garden-muted">
              <span aria-hidden="true">★</span> {average.toFixed(1)} ({reviewCount})
            </span>
          )}
        </p>
        <Button
          variant={inCart ? "ghost" : "primary"}
          full
          className="mt-auto !px-3 whitespace-nowrap"
          disabled={inCart}
          onClick={addToCart}
        >
          {inCart ? <LuCheck aria-hidden="true" /> : <LuShoppingCart aria-hidden="true" />}
          <span className="first-letter:uppercase">
            {inCart ? t("content.item.addedToCart") : t("content.item.addToCart")}
          </span>
        </Button>
      </div>
    </article>
  );
};

export default observer(WishListItem);
