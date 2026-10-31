"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { LuCheck, LuShoppingCart } from "react-icons/lu";
import { Link } from "@/navigation";
import Button, { buttonClass } from "@/shared/ui/Button";
import QuantityStepper from "@/shared/ui/QuantityStepper";
import { lineLimit, type ProductRef } from "../domain/cart";
import { useCart } from "../application/useCart";

interface Props {
  product: ProductRef;
  /** "icon" for product cards, "full" (quantity + button) for the product page. */
  variant?: "icon" | "full";
}

/**
 * Adds a product to the cart. Catalog UI receives it through its `actions`
 * slot, so the catalog never imports the cart (cart depends on catalog).
 */
const AddToCartButton = ({ product, variant = "icon" }: Props) => {
  const t = useTranslations("cart");
  const { add, quantityOf, hydrated, pending } = useCart();
  const [quantity, setQuantity] = useState(1);

  const inCart = quantityOf(product.id);
  const room = Math.max(0, lineLimit(product) - inCart);
  const soldOut = lineLimit(product) === 0;

  const addNow = async (qty: number) => {
    const result = await add(product, qty);
    if (result.ok) {
      toast.success(t("added", { title: product.title }), { toastId: `cart-${product.id}` });
      setQuantity(1);
    } else {
      // The saved cart is checked by Woo: stock can run out after the page loaded.
      toast.error(t(result.code.includes("out_of_stock") ? "outOfStock" : "changeFailed"), { toastId: `cart-err-${product.id}` });
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => addNow(1)}
        disabled={!hydrated || pending || room === 0}
        aria-label={soldOut ? t("soldOut") : t("addNamed", { title: product.title })}
        className={`relative shrink-0 w-11 h-11 grid place-items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-garden disabled:opacity-40 ${
          inCart > 0 ? "bg-saffron text-garden" : "bg-garden text-cream hover:bg-garden-600"
        }`}
      >
        {inCart > 0 ? <LuCheck aria-hidden="true" /> : <LuShoppingCart aria-hidden="true" />}
        {inCart > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[1.25rem] h-5 px-1 grid place-items-center rounded-full bg-garden text-cream text-xs font-bold">
            <span className="sr-only">{t("inCartCount", { count: inCart })}</span>
            <span aria-hidden="true">{inCart}</span>
          </span>
        )}
      </button>
    );
  }

  if (soldOut) {
    return (
      <Button size="lg" full disabled>
        {t("soldOut")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <QuantityStepper
          value={Math.min(quantity, Math.max(1, room))}
          min={1}
          max={Math.max(1, room)}
          disabled={room === 0}
          onIncrement={() => setQuantity((q) => Math.min(q + 1, room))}
          onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
        />
        <Button size="lg" className="flex-1" disabled={!hydrated || pending || room === 0} aria-busy={pending} onClick={() => addNow(quantity)}>
          <LuShoppingCart aria-hidden="true" />
          {room === 0 ? t("limitReached") : t("add")}
        </Button>
      </div>
      {inCart > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" role="status">
          <span>{t("inCartCount", { count: inCart })}</span>
          <Link href="/cart" className={`${buttonClass({ variant: "ghost" })} !h-auto !px-0 underline underline-offset-4`}>
            {t("viewCart")}
          </Link>
        </p>
      )}
    </div>
  );
};

export default AddToCartButton;
