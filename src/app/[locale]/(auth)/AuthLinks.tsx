"use client";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/navigation";
import { safeNextPath } from "@/modules/customer";
import GoogleProvider from "./GoogleProvider";

/** The "or / Google / other page" footer under the sign-in and register forms. */
const AuthLinks = ({ page }: { page: "login" | "register" }) => {
  const login = useTranslations("loginForm");
  const reg = useTranslations("registerForm");
  // Keep "come back to …" when switching between log in and register.
  const next = safeNextPath(useSearchParams().get("next"));
  const other = page === "login" ? "/register" : "/login";
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
          href={next ? { pathname: other, query: { next } } : other}
          className="font-bold text-garden underline underline-offset-4"
        >
          {page === "login" ? login("register") : reg("login")}
        </Link>
      </p>
    </>
  );
};

export default AuthLinks;
