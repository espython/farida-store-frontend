import React from "react";
import ConfirmationPageContainer from "./components/ConfirmationPageContainer";
import { unstable_setRequestLocale } from "next-intl/server";

interface ConfirmationPageProps {
  params: { locale: string };
}

const ConfirmationPage = ({ params: { locale } }: ConfirmationPageProps) => {
  unstable_setRequestLocale(locale);
  return <ConfirmationPageContainer />;
};

export default ConfirmationPage;
