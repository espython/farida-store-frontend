"use client";
import { RegisterForm } from "@/modules/customer";
import AuthLinks from "../AuthLinks";
import { useAfterSignIn } from "../useAfterSignIn";

const RegisterPanel = () => {
  const done = useAfterSignIn();
  return (
    <>
      <RegisterForm onRegistered={done} />
      <AuthLinks page="register" />
    </>
  );
};

export default RegisterPanel;
