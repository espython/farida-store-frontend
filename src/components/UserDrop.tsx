"use client";

import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import TextField from "@/shared/ui/TextField";
import { buttonClass } from "@/shared/ui/Button";
import { StoreContext } from "@/contexts/StoreContext";
import UserLoggedInUi from "./UserLoggedInUi";

import { Button } from "@nextui-org/react";
import { useRouter } from "@/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale, useTranslations } from "next-intl";
import GoogleProvider from "@/app/[locale]/(auth)/GoogleProvider";

const UserDrop = () => {
  const { userDrop, user, loginForm, registerForm } = useContext(StoreContext);
  const { isLoggedIn, isLoading } = useAuth();
  const [uiCondition, setUiCondition] = useState(true); // Default to show login form

  const locale = useLocale();
  const t = useTranslations("loginForm");

  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      setUiCondition(!isLoggedIn);
    }
  }, [isLoggedIn, isLoading, user.isLoading, loginForm.isLoading, registerForm.isLoading]);

  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{
        scaleY: userDrop.isUserMenuDisplayed ? 1 : 0,
        opacity: userDrop.isUserMenuDisplayed ? 1 : 0,
      }}
      className={`origin-top flex flex-col gap-5 w-[22rem] text-garden absolute top-full end-0 z-[100] bg-white rounded-3xl shadow-xl border border-line overflow-hidden ${
        uiCondition ? "p-5" : ""
      }`}
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      {uiCondition ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="font-display text-xl capitalize">{t("login")}</p>
            <div className="flex items-center">
              <GoogleProvider format="small" />
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginForm.strapiLogin();
              if (isLoggedIn) {
                router.refresh();
              }
            }}
            className="flex flex-col gap-4"
          >
            <TextField
              label={t("labels.email")}
              type="email"
              autoComplete="email"
              value={loginForm.email}
                onChange={(e) => {
                  // userDrop.setEmailValue(e.target.value)
                  loginForm.setEmail(e.target.value);
                }}
                onFocus={() => {
                  userDrop.setEmailFocus(true);
                }}
                onBlur={() => {
                  userDrop.setEmailFocus(false);
                }}
            />
            <TextField
              label={t("labels.password")}
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
                onChange={(e) => {
                  // userDrop.setPasswordValue(e.target.value)
                  loginForm.setPassword(e.target.value);
                }}
                onFocus={() => {
                  userDrop.setPasswordFocus(true);
                }}
                onBlur={() => {
                  userDrop.setPasswordFocus(false);
                }}
            />
            <div className="flex flex-col gap-2">
              <Button
                isLoading={loginForm.isLoading}
                className={`${buttonClass({ full: true })} capitalize`}
                type="submit"
              >
                {t("submit")}
              </Button>
              {/* <div className='text-sm flex items-center gap-1 '>
                      <input id='remeber' type='checkbox' className='cursor-pointer'/>
                      <label htmlFor='remeber' className='cursor-pointer'>remeber me</label>
                  </div> */}
              {/* <h1 className='text-sm text-red-500'>{ userDrop.errorMessage.slice(22,userDrop.errorMessage.length-2)}</h1> */}
              {loginForm.errorMessage && (
                <p role="alert" className="text-sm text-[#b42318]">
                  {loginForm.errorMessage}
                </p>
              )}
            </div>
          </form>
        </div>
      ) : (
        <UserLoggedInUi />
      )}
    </motion.div>
  );
};

export default observer(UserDrop);
