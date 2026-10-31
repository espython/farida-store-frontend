"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import GoogleProvider from "./GoogleProvider";

/** The "or / Google / other page" footer under the sign-in and register forms. */
const AuthLinks = ({ page }: { page: "login" | "register" }) => {
  const login = useTranslations("loginForm");
  const reg = useTranslations("registerForm");
  return (
    <>
      <div className="flex items-center gap-4 text-sm text-garden-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        {login("or")}
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleProvider />
      <p className="text-center text-garden-muted">
        {page === "login" ? login("noAccount") : reg("haveAccount")}{" "}
        <Link
          href={page === "login" ? "/register" : "/login"}
          className="font-bold text-garden underline underline-offset-4"
        >
          {page === "login" ? login("register") : reg("login")}
        </Link>
      </p>
    </>
  );
};

export default AuthLinks;
