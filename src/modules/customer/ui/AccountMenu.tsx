"use client";
import { useLocale, useTranslations } from "next-intl";
import { LuChevronRight, LuLogOut, LuPackage, LuUserCog } from "react-icons/lu";
import { Link } from "@/navigation";
import { useSession } from "../application/useSession";
import { useAuthActions } from "../application/useAuthActions";

interface Props {
  /** Called when a link is followed (closes the dropdown or drawer). */
  onNavigate?: () => void;
  /** "dropdown" in the header, "drawer" in the menu sidebar. */
  variant?: "dropdown" | "drawer";
}

/** Signed-in customer: name and email, account links, sign out. */
const AccountMenu = ({ onNavigate, variant = "dropdown" }: Props) => {
  const t = useTranslations("userLoggedIn");
  const locale = useLocale();
  const { session, status } = useSession();
  const { signOut, pending } = useAuthActions();
  const pad = variant === "dropdown" ? "px-5" : "px-3 -mx-3 rounded-xl";
  const row = `flex items-center justify-between gap-2 min-h-[48px] ${pad} hover:bg-sand transition-colors`;

  const leave = async () => {
    await signOut();
    // Fresh load so legacy cookie readers (header, menus) see the signed-out state.
    window.location.assign(`/${locale}`);
  };

  return (
    <nav aria-label={t("account")} className={`flex flex-col ${variant === "dropdown" ? "py-3" : ""}`}>
      <Link href="/user" onClick={onNavigate} className={`${row} py-2`}>
        <span className="flex flex-col min-w-0">
          <span className="font-bold truncate">
            {status === "signedIn" ? session!.displayName : <span className="inline-block w-28 h-4 rounded bg-sand animate-pulse" />}
          </span>
          {status === "signedIn" && <span className="text-sm text-garden-muted truncate">{session!.email}</span>}
        </span>
        <LuChevronRight aria-hidden="true" className="shrink-0 rtl:rotate-180" />
      </Link>
      <span className={`h-px bg-line my-1 ${variant === "dropdown" ? "" : "-mx-3"}`} aria-hidden="true" />
      <Link href="/userorders" onClick={onNavigate} className={row}>
        <span className="flex gap-3 items-center">
          <LuPackage aria-hidden="true" />
          {t("orders")}
        </span>
      </Link>
      <Link href="/userprofile" onClick={onNavigate} className={row}>
        <span className="flex gap-3 items-center">
          <LuUserCog aria-hidden="true" />
          {t("profile")}
        </span>
      </Link>
      <button
        type="button"
        onClick={leave}
        disabled={pending}
        className={`${row} text-[#b42318] font-semibold disabled:opacity-50`}
      >
        <span className="flex gap-3 items-center">
          <LuLogOut aria-hidden="true" />
          {t("logout")}
        </span>
      </button>
    </nav>
  );
};

export default AccountMenu;
