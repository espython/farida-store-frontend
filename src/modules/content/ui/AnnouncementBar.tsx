"use client";
import { useTranslations } from "next-intl";
import { IoMdClose } from "react-icons/io";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { useAnnouncementBar } from "../application/usePromotions";
import PromoLink from "./PromoLink";

/** The thin bar above the header: the shop's announcements, one at a time, closable for the visit. */
const AnnouncementBar = () => {
  const t = useTranslations("announcement");
  const { messages, visible, dismiss } = useAnnouncementBar();
  if (!visible) return null;

  return (
    <aside aria-label={t("label")} className="relative bg-garden text-cream">
      <Swiper
        modules={[Autoplay, A11y, EffectFade]}
        autoplay={messages.length > 1 ? { delay: 5000, pauseOnMouseEnter: true } : false}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={messages.length > 1}
        slidesPerView={1}
        className="w-full"
      >
        {messages.map((m) => (
          <SwiperSlide key={m.id} className="bg-garden">
            <PromoLink link={m.link} className="h-9 px-10 flex items-center justify-center text-sm hover:underline underline-offset-2">
              <p className="text-center truncate">{m.text}</p>
            </PromoLink>
          </SwiperSlide>
        ))}
      </Swiper>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute top-0 end-1 z-10 w-9 h-9 grid place-items-center text-cream/80 hover:text-cream"
      >
        <IoMdClose aria-hidden="true" />
      </button>
    </aside>
  );
};

export default AnnouncementBar;
