/* eslint-disable @next/next/no-img-element -- banner images come from the WordPress media host, outside next/image's list */
"use client";
import { useTranslations } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { usePromotions } from "../application/usePromotions";
import PromoLink from "./PromoLink";

/** The shop's hero banners (16:9) as a carousel; nothing until the owner publishes one. */
const HeroBanners = () => {
  const t = useTranslations("promotions");
  const { hero } = usePromotions();
  if (hero.length === 0) return null;

  return (
    <section aria-label={t("label")}>
      <Swiper
        modules={[Autoplay, Pagination, A11y]}
        autoplay={hero.length > 1 ? { delay: 6000, pauseOnMouseEnter: true } : false}
        pagination={hero.length > 1 ? { clickable: true } : false}
        a11y={{ paginationBulletMessage: t("goTo", { index: "{{index}}" }) }}
        loop={hero.length > 1}
        slidesPerView={1}
        className="rounded-3xl overflow-hidden bg-sand"
        // Light dots: banners are photos or dark artwork.
        style={{ "--swiper-pagination-color": "#fffdf7", "--swiper-pagination-bullet-inactive-color": "#fffdf7", "--swiper-pagination-bullet-inactive-opacity": "0.55" } as React.CSSProperties}
      >
        {hero.map((b, i) => (
          <SwiperSlide key={b.id}>
            <PromoLink link={b.link} className="block">
              <img
                src={b.image!.url}
                alt={b.image!.alt || b.text}
                width={b.image!.width ?? 1600}
                height={b.image!.height ?? 900}
                loading={i === 0 ? "eager" : "lazy"}
                className="w-full aspect-video object-cover"
              />
            </PromoLink>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default HeroBanners;
