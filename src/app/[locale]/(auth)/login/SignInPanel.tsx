"use client";
import { SignInForm } from "@/modules/customer";
import AuthLinks from "../AuthLinks";
import { useAfterSignIn } from "../useAfterSignIn";

const SignInPanel = () => {
  const done = useAfterSignIn();
  return (
    <>
      <SignInForm onSignedIn={done} />
      <AuthLinks page="login" />
    </>
  );
};

export default SignInPanel;
