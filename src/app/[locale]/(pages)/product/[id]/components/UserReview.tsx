"use client";
import { Avatar, Skeleton } from "@nextui-org/react";
import React from "react";

import { FaUserLarge } from "react-icons/fa6";

import Rating from "@/components/Rating";

interface userProps {
  id?: number;
  name: string;
  date?: Date;
  rating: number;
  review: string;
  userAvatar?: string;
}

const UserReview = ({
  id,
  name,
  date,
  rating,
  review,
  userAvatar,
}: userProps) => {
  const formattedDate = new Date(date ?? "").toLocaleDateString();


  return (
    <div>
      <div className="grid grid-cols-[3rem_1fr] gap-4 items-start">
        <div className="flex flex-col gap-3">
          <Avatar
            icon={<FaUserLarge />}
            src={userAvatar ? userAvatar : ""}
            showFallback
            name=""
            classNames={{
              base: "bg-sand w-12 h-12",
              icon: "text-2xl text-garden",
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton isLoaded={name?.length !== 0} className="w-max">
            <div className="grid grid-rows-[auto_auto] md:grid-cols-[auto_auto] items-center gap-x-2">
              <p className="font-bold">{name}</p>

              <p className="text-sm text-garden-muted">{formattedDate}</p>
            </div>
          </Skeleton>
          <Skeleton isLoaded={rating !== 0} className="w-max">
            <Rating rating={rating} />
          </Skeleton>

          <Skeleton isLoaded={review?.length !== 0} className="w-full">
            <p className="w-full">{review}</p>
          </Skeleton>
        </div>
      </div>
    </div>
  );
};

export default UserReview;
