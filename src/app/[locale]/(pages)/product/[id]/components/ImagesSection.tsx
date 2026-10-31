"use client";
import { Image } from "@nextui-org/react";
import React, { useEffect, useState } from "react";

import ZoomedImage from "./ZoomedImage";

import { observer } from "mobx-react-lite";
import { useParams } from "next/navigation";
import { Images, ImagesData } from "@/stores/specificTypes/strapiProductType";
import {
  ArabicImages,
  ArabicImagesData,
} from "@/stores/specificTypes/productArabicDataType";

interface imagesProps {
  allImages: Images | ArabicImages;
}

const ImagesSection = ({ allImages }: imagesProps) => {
  const [selectedImage, setSelectedImage] = useState<
    ImagesData | ArabicImagesData
  >(allImages?.data[0]);

  useEffect(() => {
    setSelectedImage(allImages?.data[0]);
  }, [allImages?.data]);

  return (
    <div className="flex flex-col gap-3">
      <ZoomedImage
        src={`${process.env.NEXT_PUBLIC_HOST}${selectedImage?.attributes.url}`}
      />

      <div className="no-scrollbar flex gap-2 overflow-x-auto p-1 -m-1">
        {allImages?.data?.map((img, i) => (
          <button
            type="button"
            key={img.id}
            aria-label={`${i + 1} / ${allImages?.data?.length}`}
            aria-pressed={img.id === selectedImage?.id}
            className={`shrink-0 w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden bg-sand transition-shadow ${
              img.id === selectedImage?.id ? "ring-2 ring-garden ring-offset-2 ring-offset-cream" : "hover:ring-2 hover:ring-line"
            }`}
            onClick={() => {
              setSelectedImage(img);
            }}
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_HOST}${img.attributes.url}`}
              radius="none"
              removeWrapper
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default observer(ImagesSection);
