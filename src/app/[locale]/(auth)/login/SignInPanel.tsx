"use client";
import { SignInForm } from "@/modules/customer";
import AuthLinks from "../AuthLinks";
import GoogleSignInNotice from "../GoogleSignInNotice";
import { useAfterSignIn } from "../useAfterSignIn";

const SignInPanel = () => {
  const done = useAfterSignIn();
  return (
    <>
      <GoogleSignInNotice />
      <SignInForm onSignedIn={done} />
      <AuthLinks page="login" />
    </>
  );
};

export default SignInPanel;
