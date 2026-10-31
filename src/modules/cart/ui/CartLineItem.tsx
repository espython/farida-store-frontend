"use client";
import { Image } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { LuTrash2 } from "react-icons/lu";
import { Link } from "@/navigation";
import { Money } from "@/shared/kernel/Money";
import QuantityStepper from "@/shared/ui/QuantityStepper";
import { lineLimit, lineTotal, type CartLine } from "../domain/cart";
import { useCart } from "../application/useCart";

interface Props {
  line: CartLine;
  /** "page" for the cart page row, "compact" for the drawer and the header dropdown. */
  variant?: "page" | "compact";
  /** Called when a link is followed (closes the drawer). */
  onNavigate?: () => void;
}

const CartLineItem = ({ line, variant = "page", onNavigate }: Props) => {
  const t = useTranslations("cart");
  const drop = useTranslations("cartDrop");
  const currency = useTranslations("currency");
  const { setQuantity, remove } = useCart();
  const { product, quantity } = line;
  const href = `/product/${product.slug}`;
  const compact = variant === "compact";

  const price = (
    <p className="font-bold whitespace-nowrap">
      {Money.toDisplay(compact ? product.unitPrice : lineTotal(line))}{" "}
      <span className="text-sm font-semibold">{currency("currency")}</span>
    </p>
  );
  const stepper = (
    <QuantityStepper
      size={compact ? "sm" : "md"}
      value={quantity}
      max={lineLimit(product)}
      onIncrement={() => setQuantity(product.id, quantity + 1)}
      onDecrement={() => setQuantity(product.id, quantity - 1)}
    />
  );
  const removeButton = (
    <button
      type="button"
      onClick={() => remove(product.id)}
      aria-label={`${drop("remove")} ${product.title}`}
      className={`${compact ? "w-9 h-9 -mt-2 -me-2" : "w-11 h-11"} shrink-0 grid place-items-center rounded-full text-[#b42318] hover:bg-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-garden`}
    >
      <LuTrash2 aria-hidden="true" />
    </button>
  );

  return (
    <article aria-label={product.title} className={`grid ${compact ? "grid-cols-[5rem_1fr]" : "grid-cols-[5rem_1fr] md:grid-cols-[6rem_1fr]"} gap-3 md:gap-4`}>
      <Link
        href={href}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden="true"
        className="aspect-square rounded-xl overflow-hidden bg-sand"
      >
        {product.image && <Image src={product.image} alt="" radius="none" removeWrapper className="w-full h-full object-cover" />}
      </Link>
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-start gap-2">
          <Link href={href} onClick={onNavigate} className="flex-1 font-semibold leading-snug line-clamp-2 hover:text-saffron-ink">
            {product.title}
          </Link>
          {removeButton}
        </div>
        {!compact && (
          <p className="text-sm text-garden-muted" dir="ltr">
            {Money.toDisplay(product.unitPrice)} {currency("currency")} × {quantity}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {stepper}
          {price}
        </div>
        {quantity >= lineLimit(product) && (
          <p className="text-sm text-saffron-ink">{t("maxReached", { count: lineLimit(product) })}</p>
        )}
      </div>
    </article>
  );
};

export default CartLineItem;
