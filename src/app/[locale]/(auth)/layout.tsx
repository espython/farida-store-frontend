import { unstable_setRequestLocale } from "next-intl/server";

interface RootLayoutProps {
  children: React.ReactNode;

  params: { locale: string };
}

export default function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  unstable_setRequestLocale(locale);

  return children;
}
