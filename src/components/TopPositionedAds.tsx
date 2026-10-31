"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import React, { useContext, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import {
  Autoplay,
  Pagination,
  Navigation,
  A11y,
  EffectFade,
} from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/bundle";
import ShowHideFastAdsButton from "./ShowHideFastAdsButton";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";

const TopPositionedAds = () => {
  const { fastAds } = useContext(StoreContext);

  const divRef = useRef<HTMLDivElement | null>(null);
  const locale = useLocale();

  useEffect(() => {
    fastAds.getAllFastAds(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {fastAds.fastAds.length > 0 && (
        <motion.div ref={divRef} className="relative bg-garden">
          <ShowHideFastAdsButton />
          <motion.div
            initial={{ y: 0, display: "none" }}
            animate={{
              y: fastAds.showTheAds
                ? 0
                : divRef?.current?.offsetHeight
                ? -divRef.current.offsetHeight
                : 0,
              display: fastAds.showTheAds ? "block" : "none",
            }}
            transition={{
              y: { delay: 0, ease: "linear" }, // Delay y animation if showTheAds is false
              display: { delay: fastAds.showTheAds ? 0 : 0.1, ease: "linear" }, // Set duration to 0 for immediate display change
            }}
          >
            <Swiper
              modules={[
                Autoplay,
                // , Navigation
                // , Pagination
                A11y,
                EffectFade,
              ]}
              autoplay={{
                pauseOnMouseEnter: true,
                waitForTransition: true,
                delay: 5000,
              }}
              // navigation
              // pagination={{clickable:true}}

              effect="fade"
              spaceBetween={0}
              slidesPerView={1}
              className="w-full  flex items-center justify-center"
            >
              {fastAds.fastAds.map((ad) => (
                <SwiperSlide
                  key={ad.id}
                  className="!h-9 bg-garden text-cream text-sm px-10 flex items-center justify-center"
                >
                  <p className="text-center truncate">{ad.attributes.ad}</p>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default observer(TopPositionedAds);
