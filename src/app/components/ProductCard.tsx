/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { StoreContext } from "@/contexts/StoreContext";
import { Button, Divider, Image } from "@nextui-org/react";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { FaRegHeart } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import Icon from "../../components/Icon";
import Rating from "../../components/Rating";
import { Link, useRouter } from "@/navigation";
import { observer } from "mobx-react-lite";
import { strapiProductType } from "@/stores/specificTypes/strapiProductType";
import { cartProductType } from "@/stores/specificTypes/cartProductType";
import { isUserLoggedIn } from "@/functions/credentials";
import { motion } from "framer-motion";

import { getTheLengthOfAllowedRatings } from "@/functions/getTheLengthOfAllowedRatings";
import ProductTypeLabel from "./ProductTypeLabel";
import { useLocale, useTranslations } from "next-intl";

interface productCardProps {
  product: strapiProductType;
}

const ProductCard = ({ product }: productCardProps) => {
  const locale = useLocale();
  const t = useTranslations("product");
  const currency = useTranslations("currency");

  const { products, cart, user, userWishlist } =
    useContext(StoreContext);

  const router = useRouter();

  const [foundInCart, setFoundInCart] = useState<cartProductType | undefined>();

  const [addingToUserCartLoading, setAddingToUserCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const foundInWishlist = useMemo(() => {
    return userWishlist.isFoundedInWishList(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userWishlist.userWishlistProductsCount, wishlistLoading]);

  const getPriceAfterDiscount = () => {
    return products.getPriceAfterDiscount(
      product.attributes.discount?.data,
      product.attributes.price
    );
  };

  const isProductAvailable = () => {
    const stock = product?.attributes?.product_inventory?.data?.attributes?.available_in_stock;
    return stock != null && stock > 0;
  };

  const addProductToCart = () => {
    // Check if product is available in stock
    if (!isProductAvailable()) {
      return;
    }

    if (isUserLoggedIn()) {
      if (!foundInCart) {
        setAddingToUserCartLoading(true);
        user
          .addProductToUserCart(product.id, 1)
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
        imgSrc: product.attributes.thumbnail?.data?.attributes?.url
          ? `${process.env.NEXT_PUBLIC_HOST}${product.attributes.thumbnail.data.attributes.url}`
          : '',
        title: product.attributes.title,
        slug: product.attributes.slug,
        description: product.attributes.description,
        prePrice: getPriceAfterDiscount()
          ? Number(Number(product.attributes.price).toFixed(2))
          : 0,
        price:
          getPriceAfterDiscount() ??
          Number(Number(product.attributes.price).toFixed(2)),
        quantity: 1,
        localizatons: {
          title: product.attributes.localizations?.data?.[0]?.attributes?.title || product.attributes.title,
          description: product.attributes.localizations?.data?.[0]?.attributes?.description || product.attributes.description,
          slug: product.attributes.localizations?.data?.[0]?.attributes?.slug || product.attributes.slug,
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
      className="flex   p-3 lmob:px-2  md:px-10 lg:p-0 w-full shadow-sm"
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      <div className="relative flex flex-col w-full ">
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
        <div
          className={`  absolute top-0 ${
            locale === "en" ? "right-0" : "left-0"
          }  z-20 flex justify-center items-center `}
        >
          {!foundInWishlist ? (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: wishlistLoading ? 0 : 1 }}
            >
              <Icon
                icon={<FaRegHeart className="text-mainPink " />}
                backColor="#ffffff"
                hasBorder
                whenClick={addProductToWishlist}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: wishlistLoading ? 0 : 1 }}
            >
              <Icon
                icon={<FaHeart className="text-mainPink " />}
                backColor="#ffffff"
                hasBorder
                whenClick={removeProductFromWishlist}
              />
            </motion.div>
          )}
        </div>
        <Link
          href={`/product/${product.id}`}
          className="w-full grid place-items-center overflow-hidden"
        >
          <Image
            //   as={NextImage}
            src={product.attributes.thumbnail?.data?.attributes?.url
              ? `${process.env.NEXT_PUBLIC_HOST}${product.attributes.thumbnail.data.attributes.url}`
              : ""}
            radius="sm"
            //   quality={100}
            alt="product image"
            className="w-full  aspect-square  grid place-items-center overflow-hidden "
            classNames={{
              img: "w-full   h-full  object-contain justify-self-center",
            }}
          />
        </Link>

        <div className="p-2 flex flex-col gap-2  ">
          <div className="flex flex-col gap-3">
            <h1 className="text-sm md:text-xl   line-clamp-1 ">
              {locale === "en"
                ? product.attributes.title
                : product.attributes.localizations?.data?.[0]?.attributes?.title || product.attributes.title}{" "}

            </h1>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Rating
                  rating={products.getAverageRatings(
                    product.attributes.reviews?.data || []
                  )}
                  size="1rem"
                />
                <h1 className="text-mainBlack/50 text-sm">
                  ({getTheLengthOfAllowedRatings(product.attributes.reviews || { data: [] })})
                </h1>
              </div>
              <div className="flex items-center gap-5">
                {getPriceAfterDiscount() && (
                  <div className="relative ">
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-[2px] bg-black/50 -rotate-3" />
                    <h2 className="text-sm md:text-xl text-mainBlack/30 font-bold  text-center">
                      {Number(product.attributes.price).toFixed(2)}
                      <span className="text-sm ltr:ml-1 rtl:mr-1">
                        {currency("currency")}
                      </span>
                    </h2>
                  </div>
                )}
                <h2 className="text-sm md:text-xl text-mainBlack/70 font-bold">
                  {getPriceAfterDiscount()
                    ? getPriceAfterDiscount()
                    : Number(product.attributes.price).toFixed(2)}
                  <span className="text-sm ltr:ml-1 rtl:mr-1">
                    {currency("currency")}
                  </span>
                </h2>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Divider />
            <Button
              className={` ${
                !!foundInCart ? `bg-emerald-500` :
                !isProductAvailable() ? `bg-gray-400` : `bg-mainPink`
              } text-mainWhite w-full rounded-md transition-all capitalize hover:bg-mainPink/90 text-sm md:text-xl `}
              endContent={!!foundInCart ? <FaCheck /> : <AiOutlineShoppingCart />}
              size="md"
              isLoading={addingToUserCartLoading}
              isDisabled={!!foundInCart || !isProductAvailable()}
              onClick={addProductToCart}
            >
              {!!foundInCart ? t("added") :
               !isProductAvailable() ? (locale === "ar" ? "غير متوفر" : "Out of Stock") :
               t("add")} {!isProductAvailable() ? "" : t("cart")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(ProductCard);
