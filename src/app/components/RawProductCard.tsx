"use client";
import Icon from "@/components/Icon";
import Rating from "@/components/Rating";
import { StoreContext } from "@/contexts/StoreContext";
import { isUserLoggedIn } from "@/functions/credentials";
import { cartProductType } from "@/stores/specificTypes/cartProductType";

import { strapiProductType } from "@/stores/specificTypes/strapiProductType";
import { Button, Image } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { Link, useRouter } from "@/navigation";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { FaRegHeart } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { motion } from "framer-motion";
import { getTheLengthOfAllowedRatings } from "@/functions/getTheLengthOfAllowedRatings";
import ProductTypeLabel from "./ProductTypeLabel";
import { useLocale, useTranslations } from "next-intl";

interface rawProductProps {
  product: strapiProductType;
}

const RawProductCard = ({ product }: rawProductProps) => {
  const locale = useLocale();
  const t = useTranslations("product");
  const currency = useTranslations("currency");

  const { products, cart, wishlist, user, userWishlist } =
    useContext(StoreContext);

  const router = useRouter();

  const [foundInCart, setFoundInCart] = useState<cartProductType | undefined>();

  const [addingToUserCartLoading, setAddingToUserCartLoading] = useState(false);

  const [counter, setCounter] = useState(1);

  const [wishlistLoading, setWishlistLoading] = useState(false);

  const foundInWishlist = useMemo(() => {
    return userWishlist.isFoundedInWishList(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userWishlist.userWishlistProductsCount, wishlistLoading]);

  const increase = () => {
    setCounter((c) => c + 1);
  };
  const decrease = () => {
    counter > 1 && setCounter((c) => c - 1);
  };

  const getPriceAfterDiscount = () => {
    return products.getPriceAfterDiscount(
      product.attributes.discount.data,
      product.attributes.price
    );
  };

  const addProductToCart = () => {
    if (isUserLoggedIn()) {
      if (!foundInCart) {
        setAddingToUserCartLoading(true);
        user
          .addProductToUserCart(product.id, counter)
          .then(() => {
            cart.setProductsCount = cart.productsCount + 1;
            setAddingToUserCartLoading(false);
          })
          .catch((err) => {
            setAddingToUserCartLoading(false);
          });
      }
    } else {
      setAddingToUserCartLoading(true);
      const parsedProductToCartProduct: cartProductType = {
        id: product.id,
        imgSrc: `${process.env.NEXT_PUBLIC_HOST}${product.attributes?.thumbnail?.data.attributes.url}`,
        title: product.attributes.title,
        slug: product.attributes.slug,
        description: product.attributes.description,
        prePrice: getPriceAfterDiscount()
          ? Number(product.attributes?.price)
          : 0,
        price:
          getPriceAfterDiscount() ??
          Number(product.attributes?.price),
        quantity: counter,
        localizatons: {
          title: product.attributes?.localizations?.data[0].attributes.title,
          description:
            product.attributes?.localizations?.data[0].attributes.description,
          slug: product.attributes?.localizations?.data[0].attributes.slug,
        },
      };

      cart.addProduct(parsedProductToCartProduct);
      setAddingToUserCartLoading(false);
    }
  };
  const addProductToWishlist = () => {
    if (isUserLoggedIn() && !userWishlist.isFoundedInWishList(product.id)) {
      setWishlistLoading(true);
      userWishlist.addProductToUserWishlist(product.id).then((ok) => {
        if (ok) {
          userWishlist.setUserWishlistProductCount =
            userWishlist.setUserWishlistProductCount + 1;
          setWishlistLoading(false);
        }
      });
    } else {
      router.push("/login");
    }
  };

  const removeProductFromWishlist = () => {
    if (isUserLoggedIn() && userWishlist.isFoundedInWishList(product.id)) {
      setWishlistLoading(true);
      userWishlist
        .removeProductFromUserWishlistByProductId(product.id)
        .then((ok) => {
          if (ok) {
            userWishlist.setUserWishlistProductCount =
              userWishlist.setUserWishlistProductCount - 1;
            setWishlistLoading(false);
          }
        });
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    if (isUserLoggedIn()) {
      setFoundInCart(cart.isInUserCart(product.id));
    } else {
      setFoundInCart(cart.isInCart(product.id));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.totalPrice]);

  return (
    <div
      className="grid items-center grid-cols-1  lmob:grid-cols-2 grid-rows-[auto] gap-5 border-2 border-mainGray shadow-md border-solid h-full p-3 "
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      <div className="relative w-full h-auto">
        <div
          className={`flex flex-col gap-1 absolute top-2 ${
            locale === "en" ? "left-2" : "right-2"
          }`}
        >
          {product.attributes.type === "sale" && (
            <ProductTypeLabel
              title={t("sale")}
              classNames={{
                container: "bg-saffron text-garden",
              }}
            />
          )}
          {product.attributes.type === "deal" && (
            <ProductTypeLabel
              title={t("top")}
              classNames={{
                container: "bg-garden text-cream",
              }}
            />
          )}
          {product.attributes.type === "best_seller" && (
            <ProductTypeLabel
              title={t("best")}
              classNames={{
                container: "bg-sand text-garden",
              }}
            />
          )}
        </div>

        <Link
          href={`/product/${product.id}`}
          className="w-full grid place-items-center overflow-hidden "
        >
          <Image
            //   as={NextImage}
            src={`${process.env.NEXT_PUBLIC_HOST}${product.attributes?.thumbnail?.data.attributes.url}`}
            //   quality={100}
            alt="product image"
            radius="sm"
            className="w-full  aspect-square  grid place-items-center overflow-hidden "
            classNames={{
              img: "w-full h-full object-contain",
            }}
          />
          {/* <Image
            //   as={NextImage}
            src={`${process.env.NEXT_PUBLIC_HOST}${product.attributes?.thumbnail?.data.attributes.url}`}
            radius="sm"
            //   quality={100}
            alt="product image"
            className="w-full  aspect-square  grid place-items-center overflow-hidden "
            classNames={{
              img: "w-full   h-full  object-contain justify-self-center",
            }}
          /> */}
        </Link>
      </div>

      <div className="flex flex-col gap-3 py-5">
        <h1 className="text-sm md:text-xl   w-full line-clamp-1">
          {locale === "en"
            ? product.attributes.title
            : product.attributes?.localizations?.data[0].attributes.title}
        </h1>
        <div className="flex items-center gap-2">
          <Rating
            rating={products.getAverageRatings(product.attributes.reviews.data)}
            size="1rem"
          />
          <h1 className="text-sm">
            ({getTheLengthOfAllowedRatings(product.attributes.reviews)})
          </h1>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              disabled={foundInCart ? true : false}
              className={`p-2 md:p-3 ${
                foundInCart
                  ? `border-mainBlack/20 text-mainBlack/20 `
                  : `border-mainBlack`
              } border-1 border-solid text-lg md:text-xl`}
              onClick={increase}
            >
              +
            </button>
            <h1
              className={`text-lg md:text-xl  border-y-1 ${
                foundInCart
                  ? `border-mainBlack/20 text-mainBlack/20 `
                  : `border-mainBlack`
              } border-solid p-2 px-3 md:p-3 md:px-5`}
            >
              {foundInCart ? foundInCart.quantity : counter}
            </h1>
            <button
              disabled={foundInCart ? true : false}
              className={`p-2 md:p-3 ${
                foundInCart
                  ? `border-mainBlack/20 text-mainBlack/20 `
                  : `border-mainBlack`
              } border-1 border-solid text-lg md:text-xl`}
              onClick={decrease}
            >
              -
            </button>
          </div>
          <div className="  flex justify-center items-center ">
            {!foundInWishlist ? (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: wishlistLoading ? 0 : 1 }}
              >
                <Icon icon={<FaRegHeart />} whenClick={addProductToWishlist} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: wishlistLoading ? 0 : 1 }}
              >
                <Icon
                  icon={<FaHeart className="text-mainPink" />}
                  whenClick={removeProductFromWishlist}
                />
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          {getPriceAfterDiscount() && (
            <div className="relative ">
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-black/50 -rotate-3" />
              <h2 className="text-sm md:text-xl text-mainBlack/30 font-bold  text-center">
                {product.attributes?.price}
                <span className="text-sm ltr:ml-1 rtl:mr-1">
                  {currency("currency")}
                </span>
              </h2>
            </div>
          )}
          <h2 className="text-sm md:text-xl text-mainBlack/70 font-bold">
            {getPriceAfterDiscount()
              ? getPriceAfterDiscount()
              : product.attributes?.price}
            <span className="text-sm ltr:ml-1 rtl:mr-1">
              {currency("currency")}
            </span>
          </h2>
        </div>

        <Button
          className={` ${
            foundInCart ? `bg-emerald-500` : `bg-mainPink`
          } text-mainWhite w-full rounded-md transition-all capitalize hover:bg-mainPink/90 text-sm md:text-xl`}
          endContent={foundInCart ? <FaCheck /> : <AiOutlineShoppingCart />}
          size="md"
          isLoading={addingToUserCartLoading}
          isDisabled={foundInCart ? true : false}
          onClick={addProductToCart}
        >
          {foundInCart ? t("added") : t("add")} {t("cart")}
        </Button>
      </div>
    </div>
  );
};

export default observer(RawProductCard);
