"use client";
import { useTranslations } from "next-intl";
import { LuLogIn, LuPackageOpen, LuPackageX } from "react-icons/lu";
import { Link } from "@/navigation";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";

/** Shared non-happy states of the order pages. */
export const OrderLoading = ({ tall = false }: { tall?: boolean }) => (
  <div className={`${tall ? "h-96" : "h-72"} rounded-3xl bg-sand animate-pulse`} aria-busy="true" />
);

export const OrderNotFound = () => {
  const t = useTranslations("orders");
  return (
    <EmptyState
      role="status"
      icon={<LuPackageX />}
      title={t("states.notFound")}
      text={t("states.notFoundText")}
      action={
        <Link href="/userorders" className={buttonClass()}>
          {t("states.myOrders")}
        </Link>
      }
    />
  );
};

export const OrdersUnavailable = ({ retry }: { retry: () => void }) => {
  const t = useTranslations("orders");
  return (
    <EmptyState
      role="alert"
      title={t("states.unavailable")}
      action={
        <button type="button" className={buttonClass()} onClick={retry}>
          {t("states.retry")}
        </button>
      }
    />
  );
};

export const OrdersSignIn = () => {
  const t = useTranslations("orders");
  return (
    <EmptyState
      icon={<LuLogIn />}
      title={t("states.signIn")}
      action={
        <Link href="/login" className={buttonClass()}>
          {t("states.signInAction")}
        </Link>
      }
    />
  );
};

export const NoOrders = () => {
  const t = useTranslations("orders");
  return (
    <EmptyState
      icon={<LuPackageOpen />}
      title={t("empty.title")}
      text={t("empty.text")}
      action={
        <Link href="/" className={buttonClass()}>
          {t("empty.action")}
        </Link>
      }
    />
  );
};
