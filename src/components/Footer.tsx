"use client";
import { Image } from "@nextui-org/react";
import React from "react";
import { TfiEmail, TfiHeadphone } from "react-icons/tfi";
import { FaFacebookF, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { useTranslations } from "next-intl";
import BrandLogo from "@/shared/ui/BrandLogo";
import PerksStrip from "@/shared/ui/PerksStrip";

const SOCIAL = [
  { label: "Facebook", icon: <FaFacebookF aria-hidden="true" /> },
  { label: "Instagram", icon: <FaInstagram aria-hidden="true" /> },
  { label: "Twitter", icon: <FaTwitter aria-hidden="true" /> },
  { label: "LinkedIn", icon: <FaLinkedin aria-hidden="true" /> },
];

const Footer = () => {
  const t = useTranslations("footer");

  return (
    <footer className="mt-16 border-t border-line">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col gap-10">
        <PerksStrip />

        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <BrandLogo />
            <p className="text-garden-muted max-w-sm">{t("support")}</p>
            <div className="flex gap-2">
              {SOCIAL.map((s) => (
                // No profiles yet: the links stay inert until the owner provides them.
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-11 h-11 grid place-items-center rounded-full bg-white text-garden hover:bg-sand transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-display text-xl">{t("help")}</h2>
            <a href="mailto:store@farida.com" className="flex items-center gap-3 min-h-[44px] hover:text-saffron-ink">
              <TfiEmail aria-hidden="true" />
              <span>
                <span className="block text-sm text-garden-muted capitalize">{t("email")}</span>
                store@farida.com
              </span>
            </a>
            <a href="tel:01089953368" className="flex items-center gap-3 min-h-[44px] hover:text-saffron-ink">
              <TfiHeadphone aria-hidden="true" />
              <span>
                <span className="block text-sm text-garden-muted capitalize">{t("phone")}</span>
                <span dir="ltr">01089953368</span>
              </span>
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-display text-xl">{t("apps")}</h2>
            <div className="flex gap-3">
              <Image src="/apple.png" alt="App Store" className="w-32" radius="none" />
              <Image src="/google.png" alt="Google Play" className="w-32" radius="none" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-between items-center pt-6 border-t border-line">
          <p className="text-sm text-garden-muted">{t("copyrights")}</p>
          <div className="flex gap-4 items-center" aria-label={t("payments")}>
            <Image src="/MasterCard_Logo.svg.webp" alt="Mastercard" className="h-6 w-auto" radius="none" />
            <Image src="/Visa_Inc._logo.svg.png" alt="Visa" className="h-5 w-auto" radius="none" />
            <Image src="/cod-en.svg" alt={t("cod")} className="h-7 w-auto" radius="none" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
