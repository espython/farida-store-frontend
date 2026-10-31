import PageTitle from "@/components/PageTitle";
import React from "react";
import Map from "./components/Map";
import Welcoming from "./components/Welcoming";
import ComplaintForm from "./components/ComplaintForm";
import { unstable_setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import PageContainer from "@/shared/ui/PageContainer";

interface ContactPageProps {
  params: { locale: string };
}

const ContactPage = ({ params: { locale } }: ContactPageProps) => {
  unstable_setRequestLocale(locale);

  const t = useTranslations("contactPage");

  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7">
            <ComplaintForm />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Welcoming />
            <Map />
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default ContactPage;
