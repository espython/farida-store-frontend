"use client";
import { useEffect, useState } from "react";
import { Image } from "@nextui-org/react";
import InnerImageZoom from "react-inner-image-zoom";
import "react-inner-image-zoom/lib/InnerImageZoom/styles.css";
import type { ProductImage } from "../domain/Product";

interface Props {
  images: ProductImage[];
  /** Fallback alt text when an image has none. */
  title: string;
}

/** Zoomable main image with a thumbnail strip; Woo image URLs are absolute. */
const ProductGallery = ({ images, title }: Props) => {
  const [selectedId, setSelectedId] = useState(images[0]?.id);

  useEffect(() => {
    setSelectedId(images[0]?.id);
  }, [images]);

  const selected = images.find((img) => img.id === selectedId) ?? images[0];

  if (!selected) {
    return <div className="w-full aspect-square bg-mainGray rounded-md" data-testid="gallery-empty" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="w-full h-auto flex justify-center items-center">
        <InnerImageZoom
          src={selected.src}
          hasSpacer
          zoomType="hover"
          zoomPreload
          imgAttributes={{ alt: selected.alt || title, className: "w-full h-full object-cover" }}
          className="w-full h-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              aria-label={img.alt || title}
              aria-pressed={img.id === selected.id}
              className={`w-full aspect-square transition-all bg-mainGray border-solid border-2 ${
                img.id === selected.id ? "border-mainBlack" : "border-mainGray"
              } hover:border-mainPink p-1 flex items-center justify-center rounded-md`}
              onClick={() => setSelectedId(img.id)}
            >
              <Image
                src={img.thumbnail || img.src}
                radius="none"
                alt=""
                className="w-full h-auto aspect-square object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
