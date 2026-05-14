"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import { cn } from "@/lib/utils";

type PostImageGalleryProps = {
  images: Array<{
    id: string;
    imageUrl: string;
    width: number;
    height: number;
  }>;
  title?: string;
  className?: string;
};

export function PostImageGallery({ images, title = "Post image", className }: PostImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  const slides = useMemo(
    () =>
      images.map((image, index) => ({
        src: image.imageUrl,
        width: Math.max(image.width, 1),
        height: Math.max(image.height, 1),
        alt: `${title} ${index + 1}`,
      })),
    [images, title],
  );

  if (!slides.length) {
    return null;
  }

  const imageCount = slides.length;

  function getGalleryGridClassName() {
    switch (imageCount) {
      case 1:
        return "grid grid-cols-1";
      case 2:
        return "grid grid-cols-2 gap-px auto-rows-[12rem] md:auto-rows-[18rem]";
      case 3:
        return "grid grid-cols-2 gap-px auto-rows-[8rem] md:grid-cols-4 md:auto-rows-[11rem]";
      case 4:
        return "grid grid-cols-2 gap-px auto-rows-[8rem] md:auto-rows-[11rem]";
      default:
        return "grid grid-cols-2 gap-px auto-rows-[7rem] md:grid-cols-4 md:auto-rows-[10rem]";
    }
  }

  function getGalleryItemClassName(index: number) {
    switch (imageCount) {
      case 1:
        return "aspect-[4/5] md:aspect-[16/10]";
      case 3:
        if (index === 0) {
          return "col-span-2 row-span-2 md:col-span-2";
        }

        return "md:col-span-2";
      case 5:
        if (index === 0) {
          return "col-span-2 row-span-2 md:col-span-2";
        }

        return "";
      default:
        return "";
    }
  }

  return (
    <>
      <div className={cn("overflow-hidden bg-black", className)}>
        <div className={getGalleryGridClassName()}>
          {slides.map((slide, index) => (
            <button
              key={images[index]?.id ?? `${slide.src}-${index}`}
              type="button"
              onClick={() => setLightboxIndex(index)}
              aria-label={slide.alt}
              className={cn(
                "relative block cursor-zoom-in overflow-hidden bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0",
                getGalleryItemClassName(index),
              )}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                unoptimized
                sizes={imageCount === 1 ? "(min-width: 768px) 720px, 100vw" : "(min-width: 768px) 720px, 100vw"}
                className="object-cover transition-transform duration-200 ease-out hover:scale-[1.015]"
              />
            </button>
          ))}
        </div>
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={slides}
        carousel={{ finite: slides.length < 2 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
}