"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { useAuth } from "@/hooks/useAuth";

import { cartProductType } from "@/stores/specificTypes/cartProductType";
import { strapiProductType } from "@/stores/specificTypes/strapiProductType";

import { Spinner } from "@nextui-org/react";
import { buttonClass } from "@/shared/ui/Button";
import { observer } from "mobx-react-lite";
import React, { useContext, useMemo, useState } from "react";

import { FaCheck } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa6";
import { MdOutlineRemoveShoppingCart } from "react-icons/md";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface AddToCartButtonProps {
  product: strapiProductType;
  /** "inline" in the desktop buy box, "bar" as the phone sticky bar. */
  placement?: "inline" | "bar";
}

const AddToCartButton = ({ product, placement = "inline" }: AddToCartButtonProps) => {
  const { cart, user, products, cartSidebar, sidebar, searchBox } =
    useContext(StoreContext);
  const { isLoggedIn } = useAuth();
  const t = useTranslations("productPage");

  // const [foundInCart, setFoundInCart] = useState<cartProductType | undefined>();
  const [addingToUserCartLoading, setAddingToUserCartLoading] = useState(false);

  const addProductToCart = () => {
    // Check if product data is valid
    if (!product || !product.attributes) {
      console.error("Product data is missing or invalid");
      return;
    }

    // Check if product is available in stock
    if (!isProductAvailable()) {
      return;
    }

    if (isLoggedIn) {
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

      // Safe access to thumbnail
      const thumbnailUrl = product.attributes.thumbnail?.data?.attributes?.url || '';
      const imgSrc = thumbnailUrl ? `${process.env.NEXT_PUBLIC_HOST}${thumbnailUrl}` : '';

      const parsedProductToCartProduct: cartProductType = {
        id: product.id,
        imgSrc: imgSrc,
        title: product.attributes.title || 'Unknown Product',
        slug: product.attributes.slug || '',
        description: product.attributes.description || '',
        prePrice: getPriceAfterDiscount()
          ? Number(getSafePrice().toFixed(2))
          : 0,
        price:
          getPriceAfterDiscount() ??
          Number(getSafePrice().toFixed(2)),
        quantity: 1,
        localizatons: {
          title: product.attributes.localizations?.data?.[0]?.attributes?.title || product.attributes.title || 'Unknown Product',
          description:
            product.attributes.localizations?.data?.[0]?.attributes?.description || product.attributes.description || '',
          slug: product.attributes.localizations?.data?.[0]?.attributes?.slug || product.attributes.slug || '',
        },
      };
      cart.addProduct(parsedProductToCartProduct);
      setAddingToUserCartLoading(false);
    }
  };

  const getPriceAfterDiscount = () => {
    return products.getPriceAfterDiscount(
      product.attributes.discount?.data,
      product.attributes.price
    );
  };

  const getSafePrice = () => {
    const price = product.attributes.price;
    return typeof price === 'number' && !isNaN(price) ? price : 0;
  };

  const isProductAvailable = () => {
    const stock = product?.attributes?.product_inventory?.data?.attributes?.available_in_stock;
    return stock != null && stock > 0;
  };

  const foundInCart = useMemo(() => {
    if (isLoggedIn) {
      return cart.isInUserCart(product.id);
    } else {
      return cart.isInCart(product.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.totalPrice, product.id]);

  const available = isProductAvailable();
  const label = !available ? t("details.outStock") : foundInCart ? t("addedToCart") : t("addToCart");
  const icon = addingToUserCartLoading ? (
    <Spinner size="sm" color="current" />
  ) : !available ? (
    <MdOutlineRemoveShoppingCart aria-hidden="true" />
  ) : foundInCart ? (
    <FaCheck aria-hidden="true" />
  ) : (
    <FaCartPlus aria-hidden="true" />
  );
  const button = (
    <button
      type="button"
      onClick={addProductToCart}
      disabled={!!foundInCart || !available}
      className={`${buttonClass({ size: "lg", full: true, variant: foundInCart ? "outline" : "primary" })} capitalize disabled:opacity-100 ${
        !available ? "!bg-sand !text-garden-muted" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );

  if (placement === "inline") return <div className="hidden md:block">{button}</div>;

  // Phones: a sticky bar above the tab bar; slides away while a drawer or the search is open.
  const hidden = cartSidebar.showCartSideBar || sidebar.showSideBar || searchBox.showSearchBox;
  return (
    <motion.div
      initial={false}
      animate={{ y: hidden ? 160 : 0 }}
      className="md:hidden fixed inset-x-3 bottom-[5.25rem] z-[84] p-2 rounded-full bg-white shadow-lg border border-line"
    >
      {button}
    </motion.div>
  );
};

export default observer(AddToCartButton);
