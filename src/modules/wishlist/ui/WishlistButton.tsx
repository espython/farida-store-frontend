"use client";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { MAX_WISHLIST } from "../domain/Wishlist";
import { useWishlist } from "../application/useWishlist";

interface Props {
  productId: string;
  title: string;
  /** "icon": round button on a card image; "full": labelled button on the product page. */
  variant?: "icon" | "full";
}

/** Save or unsave a product. Catalog UI receives it through its overlay/actions slots. */
const WishlistButton = ({ productId, title, variant = "icon" }: Props) => {
  const t = useTranslations("wishlist");
  const { has, toggle, hydrated, pending } = useWishlist();
  const saved = has(productId);

  const onClick = async () => {
    const r = await toggle(productId);
    if (r.ok) {
      toast.success(t(saved ? "removed" : "saved", { title }), { toastId: `wish-${productId}` });
    } else {
      toast.error(r.code === "full" ? t("full", { max: MAX_WISHLIST }) : t("failed"), { toastId: `wish-err-${productId}` });
    }
  };

  const label = saved ? t("removeNamed", { title }) : t("saveNamed", { title });
  const heart = saved ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!hydrated || pending}
        aria-pressed={saved}
        aria-label={label}
        className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border-2 border-garden text-garden font-bold hover:bg-sand transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-garden"
      >
        <span className={saved ? "text-[#b42318]" : undefined}>{heart}</span>
        <span aria-hidden="true">{saved ? t("savedLabel") : t("saveLabel")}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!hydrated || pending}
      aria-pressed={saved}
      aria-label={label}
      className={`w-11 h-11 grid place-items-center rounded-full bg-white/90 hover:bg-white transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-garden ${
        saved ? "text-[#b42318]" : "text-garden"
      }`}
    >
      {heart}
    </button>
  );
};

export default WishlistButton;
