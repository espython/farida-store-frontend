"use client";
import { useTranslations } from "next-intl";
import { LuLogIn, LuShoppingBag } from "react-icons/lu";
import { Link } from "@/navigation";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";

/** Shared non-happy states of the checkout steps. */
export const CheckoutLoading = () => <div className="h-72 rounded-3xl bg-sand animate-pulse" aria-busy="true" />;

export const CheckoutSignIn = () => {
  const t = useTranslations("checkout");
  return (
    <EmptyState
      icon={<LuLogIn />}
      title={t("states.signInTitle")}
      text={t("states.signInText")}
      action={
        <Link href="/login" className={buttonClass()}>
          {t("states.signIn")}
        </Link>
      }
    />
  );
};

export const CheckoutEmpty = () => {
  const t = useTranslations("checkout");
  return (
    <EmptyState
      icon={<LuShoppingBag />}
      title={t("states.emptyTitle")}
      action={
        <Link href="/" className={buttonClass()}>
          {t("states.shop")}
        </Link>
      }
    />
  );
};

export const CheckoutUnavailable = ({ retry }: { retry: () => void }) => {
  const t = useTranslations("checkout");
  return (
    <EmptyState
      role="alert"
      title={t("errors.unavailable")}
      action={
        <button type="button" className={buttonClass()} onClick={retry}>
          {t("states.retry")}
        </button>
      }
    />
  );
};
