"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { usePromotions } from "../application/usePromotions";
import PromoLink from "./PromoLink";

/** The promo band on category pages; nothing when the shop has none. */
const MiniPromos = () => {
  const { mini } = usePromotions();
  if (mini.length === 0) return null;

  return (
    <div className="py-6 md:py-8">
      <Swiper
        modules={[Autoplay, A11y, EffectFade]}
        autoplay={mini.length > 1 ? { delay: 5000, pauseOnMouseEnter: true } : false}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={mini.length > 1}
        slidesPerView={1}
      >
        {mini.map((m) => (
          <SwiperSlide key={m.id}>
            <PromoLink link={m.link} className="block bg-saffron text-garden rounded-3xl px-6 py-8 md:py-10">
              <p className="text-center font-display text-xl md:text-[1.75rem] leading-snug">{m.text}</p>
            </PromoLink>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MiniPromos;
