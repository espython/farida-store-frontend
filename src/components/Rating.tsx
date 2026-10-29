"use client";
import React from "react";
import { FaStar } from "react-icons/fa";
import { FaStarHalfAlt } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";

import ReactStars from "react-rating-star-with-type";

interface iprops {
  rating?: number;
  size?: string;
}

/** Five stars in saffron with the average beside them; screen readers get "4.5 out of 5". */
const Rating = ({ rating, size = "1.125rem" }: iprops) => {
  const value = Number((rating ?? 0).toFixed(1));
  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={`${value} / 5`}>
      <span aria-hidden="true" className="flex">
        <ReactStars
          value={value}
          count={5}
          activeColor="#c9962b"
          inactiveColor="#dcdacb"
          filledIcon={<FaStar />}
          halfIcon={<FaStarHalfAlt className="ltr:rotate-0 rtl:-rotate-180 origin-center" />}
          size={size}
          emptyIcon={<FaRegStar />}
        />
      </span>
      <span aria-hidden="true" className="text-sm font-semibold">
        {value.toFixed(1)}
      </span>
    </div>
  );
};

export default Rating;
