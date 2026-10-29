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
    return <div className="w-full aspect-square bg-sand rounded-3xl" data-testid="gallery-empty" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* The zoom figure fills the 1:1 frame; the photo is cropped to it (cover). */}
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-sand [&_.iiz]:!absolute [&_.iiz]:inset-0 [&_.iiz]:!w-full [&_.iiz]:!h-full [&_.iiz>div]:h-full [&_.iiz\_\_img]:!w-full [&_.iiz\_\_img]:!h-full [&_.iiz\_\_img]:object-cover">
        <InnerImageZoom
          src={selected.src}
          hasSpacer={false}
          zoomType="hover"
          zoomPreload
          imgAttributes={{ alt: selected.alt || title, className: "w-full h-full object-cover" }}
          className="w-full h-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto p-1 -m-1">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              aria-label={img.alt || title}
              aria-pressed={img.id === selected.id}
              className={`shrink-0 w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden bg-sand transition-shadow ${
                img.id === selected.id ? "ring-2 ring-garden ring-offset-2 ring-offset-cream" : "hover:ring-2 hover:ring-line"
              }`}
              onClick={() => setSelectedId(img.id)}
            >
              <Image
                src={img.thumbnail || img.src}
                radius="none"
                removeWrapper
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
