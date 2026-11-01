import "./globals.css";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import NavBar from "@/components/Navbar";

import StoreContextProvider from "@/stores";

import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import CartFloatingButton from "@/components/CartFloatingButton";
import CartSideBar from "@/components/CartSideBar";
import TopPositionedAds from "@/components/TopPositionedAds";
import BottomNavigation from "@/components/BottomNavigation";
import GoTopFloatingButton from "@/components/GoTopFloatingButton";
import { NextIntlClientProvider, useMessages } from "next-intl";
import { unstable_setRequestLocale } from "next-intl/server";
import Uiproviders from "@/providers/UiProviders";
import ReduxStoreProvider from "@/store/StoreProvider";
import { elMessiri, fraunces } from "@/shared/ui/fonts";
import Toaster from "@/shared/ui/Toaster";
import { CartSync } from "@/modules/cart";
import { WishlistSync } from "@/modules/wishlist";

export const metadata = {
  title: { default: "Farida Store", template: "%s | Farida Store" },
  description: "The Market of Farida Store",
};

interface RootLayoutProps {
  children: React.ReactNode;

  params: { locale: string };
}

// Can be imported from a shared config
const locales = ["en", "ar"];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  unstable_setRequestLocale(locale);

  const messages = useMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${fraunces.variable} ${elMessiri.variable}`}
      // className="text-[10px] sm:text-[12px] md:text-[14px] lg:text-[16px]"
      // style={{ direction: locale === "en" ? "ltr" : "rtl" }}
    >
      <body className={`font-cairo flex flex-col `} suppressHydrationWarning={true}>
        <Uiproviders>
          <ReduxStoreProvider>
          <StoreContextProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <div className="h-full   flex flex-col">
                <div className="relative ">
                  <Sidebar />
                  <CartSideBar />
                  <TopPositionedAds />
                  <CartFloatingButton />
                  <GoTopFloatingButton />
                  <BottomNavigation />
                  <Toaster />
                  {/* Cart storage, cross-tab sync and the guest → account merge (needs translations and the store). */}
                  <CartSync />
                  <WishlistSync />
                </div>
                {/* Outside the wrapper above so it stays sticky for the whole page. */}
                <NavBar />
                <div className="flex-1 block"> {children}</div>
                {/* Room for the phone tab bar. */}
                <div className="pb-24 md:pb-0">
                  {/* <Footer /> */}

                  <Footer />
                </div>
              </div>
            </NextIntlClientProvider>
          </StoreContextProvider>
          </ReduxStoreProvider>
        </Uiproviders>
      </body>
    </html>
  );
}
