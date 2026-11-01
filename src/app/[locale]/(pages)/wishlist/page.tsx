import { useTranslations } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import PageTitle from "@/components/PageTitle";
import PageContainer from "@/shared/ui/PageContainer";
import WishlistPageContent from "./WishlistPageContent";

interface WishListPageProps {
  params: { locale: string };
}

const WishListPage = ({ params: { locale } }: WishListPageProps) => {
  unstable_setRequestLocale(locale);
  const t = useTranslations("wishlist");
  return (
    <>
      <PageTitle title={t("title")} />
      <PageContainer className="pt-6 pb-8">
        <WishlistPageContent />
      </PageContainer>
    </>
  );
};

export default WishListPage;
