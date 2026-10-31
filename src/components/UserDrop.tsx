"use client";

import React, { useContext } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useLocale, useTranslations } from "next-intl";
import { StoreContext } from "@/contexts/StoreContext";
import { SignInForm, useSession } from "@/modules/customer";
import GoogleProvider from "@/app/[locale]/(auth)/GoogleProvider";
import UserLoggedInUi from "./UserLoggedInUi";

/** Hover dropdown under the header account icon: sign-in form or the account menu. */
const UserDrop = () => {
  const { userDrop } = useContext(StoreContext);
  const { status } = useSession();
  const locale = useLocale();
  const t = useTranslations("loginForm");
  const signedIn = status === "signedIn";

  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{
        scaleY: userDrop.isUserMenuDisplayed ? 1 : 0,
        opacity: userDrop.isUserMenuDisplayed ? 1 : 0,
      }}
      className={`origin-top flex flex-col gap-5 w-[22rem] text-garden absolute top-full end-0 z-[100] bg-white rounded-3xl shadow-xl border border-line overflow-hidden ${
        signedIn ? "" : "p-5"
      }`}
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      {signedIn ? (
        <UserLoggedInUi />
      ) : status === "loading" ? (
        <div className="h-40 rounded-2xl bg-sand animate-pulse" aria-busy="true" />
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="font-display text-xl capitalize">{t("login")}</p>
            <GoogleProvider format="small" />
          </div>
          {/* Fresh load so legacy cookie readers pick up the session. */}
          <SignInForm compact onSignedIn={() => window.location.reload()} />
        </div>
      )}
    </motion.div>
  );
};

export default observer(UserDrop);
