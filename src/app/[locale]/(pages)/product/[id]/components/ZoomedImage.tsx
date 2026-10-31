"use client"
import { Skeleton } from '@nextui-org/react';
import React from 'react'
import InnerImageZoom from 'react-inner-image-zoom'
import 'react-inner-image-zoom/lib/InnerImageZoom/styles.css';

interface zoomProps{
    src?:string
}

const ZoomedImage = ({ src }: zoomProps) => {
  return (
    <Skeleton isLoaded={!!src} className="rounded-3xl">
      {/* Same 1:1 cover frame as the Woo ProductGallery. */}
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-sand [&_.iiz]:!absolute [&_.iiz]:inset-0 [&_.iiz]:!w-full [&_.iiz]:!h-full [&_.iiz>div]:h-full [&_.iiz\_\_img]:!w-full [&_.iiz\_\_img]:!h-full [&_.iiz\_\_img]:object-cover">
        <InnerImageZoom src={src ?? ""} hasSpacer={false} zoomType="hover" zoomPreload />
      </div>
    </Skeleton>
  );
};

export default ZoomedImage