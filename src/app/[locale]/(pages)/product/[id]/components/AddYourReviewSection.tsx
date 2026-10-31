"use client";
import LoadingOverlay from "@/components/LoadingOverlay";
import { StoreContext } from "@/contexts/StoreContext";
import { Button, Textarea } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { buttonClass } from "@/shared/ui/Button";
import { useTranslations } from "next-intl";
import React, { useContext, useState } from "react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import ReactStars from "react-rating-star-with-type";
import { useScreenSize } from "react-screen-size-helper";

interface AddYourReviewSectionProps {
  productId: string | number;
}

const AddYourReviewSection = ({ productId }: AddYourReviewSectionProps) => {
  const { user, products } = useContext(StoreContext);
  const { currentWidth } = useScreenSize({});
  const t = useTranslations("productPage");

  const submitReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user.userReviewDescription.length > 0 && user.userReviewRating > 0) {
      user.addReviewToProduct(productId).then((ok) => {
        if (ok) {
          user.resetAllAddReviewSectionStates();
          products.getTargetProductsReviews(productId.toString());
        }
      });
    }
  };

  return (
    <div className="relative mt-8 p-5 md:p-6 bg-white rounded-3xl flex flex-col gap-4">
      {user.userReviewLoading && <LoadingOverlay />}
      <h3 className="font-display text-xl capitalize">{t("details.addReview")}</h3>

      <form
        onSubmit={(e) => {
          submitReview(e);
        }}
        className="flex flex-col items-start gap-5"
      >
        <div className="flex items-center gap-5">
          <span className="text-sm font-semibold capitalize">{t("details.rating")}</span>
          <ReactStars
            value={user.userReviewRating}
            count={5}
            filledIcon={<FaStar />}
            halfIcon={<FaStarHalfAlt />}
            emptyIcon={<FaRegStar />}
            isEdit
            isHalf
            activeColor="#c9962b"
            inactiveColor="#dcdacb"
            onChange={(value) => {
              user.setUserReviewRating = value;
            }}
            size={currentWidth > 768 ? "1.3rem" : "1.1rem"}
          />
        </div>
        <Textarea
          value={user.userReviewDescription}
          aria-label={t("details.review")}
          placeholder={t("details.review")}
          radius="lg"
          classNames={{ inputWrapper: "bg-cream border border-line shadow-none" }}
          minRows={currentWidth > 768 ? 5 : 3}
          onChange={(e) => {
            user.setUserReviewDescription = e.target.value;
          }}
        />
        <Button className={`${buttonClass()} capitalize`} type="submit">
          {t("details.submit")}
        </Button>
      </form>
    </div>
  );
};

export default observer(AddYourReviewSection);
