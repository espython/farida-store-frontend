"use client";
import { useTranslations } from "next-intl";
import { LuLogIn } from "react-icons/lu";
import { Link } from "@/navigation";
import EmptyState from "@/shared/ui/EmptyState";
import { buttonClass } from "@/shared/ui/Button";

/** Shared non-happy states of the account pages. */
export const AccountLoading = () => <div className="max-w-3xl mx-auto h-72 rounded-3xl bg-sand animate-pulse" aria-busy="true" />;

export const AccountUnavailable = ({ retry }: { retry: () => void }) => {
  const t = useTranslations("account.states");
  return (
    <EmptyState
      role="alert"
      title={t("unavailable")}
      action={
        <button type="button" className={buttonClass()} onClick={retry}>
          {t("retry")}
        </button>
      }
    />
  );
};

export const AccountSignIn = () => {
  const t = useTranslations("account.states");
  return (
    <EmptyState
      icon={<LuLogIn />}
      title={t("signIn")}
      action={
        <Link href="/login" className={buttonClass()}>
          {t("signInAction")}
        </Link>
      }
    />
  );
};
