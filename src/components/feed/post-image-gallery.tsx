"use client";

import { useMemo, useState } from "react";
import PhotoAlbum, { type Photo } from "react-photo-album";
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

  const photos = useMemo<Photo[]>(
    () =>
      images.map((image, index) => ({
        key: image.id,
        src: image.imageUrl,
        width: Math.max(image.width, 1),
        height: Math.max(image.height, 1),
        alt: `${title} ${index + 1}`,
      })),
    [images, title],
  );

  if (!photos.length) {
    return null;
  }

  return (
    <>
      <div className={cn("bg-background/20 p-2", className)}>
        <PhotoAlbum
          layout="rows"
          photos={photos}
          spacing={8}
          padding={0}
          defaultContainerWidth={720}
          targetRowHeight={photos.length === 1 ? 520 : 240}
          rowConstraints={{ singleRowMaxHeight: 620 }}
          sizes={{
            size: "100vw",
            sizes: [
              { viewport: "(min-width: 1024px)", size: "680px" },
              { viewport: "(min-width: 768px)", size: "720px" },
            ],
          }}
          onClick={({ index }) => setLightboxIndex(index)}
          componentsProps={{
            container: { className: "!block" },
            button: { className: "cursor-zoom-in overflow-hidden rounded-[1rem]" },
            image: { className: "rounded-[1rem] object-cover" },
          }}
        />
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={photos.map((photo) => ({
          src: photo.src,
          width: photo.width,
          height: photo.height,
          alt: photo.alt,
        }))}
        carousel={{ finite: photos.length < 2 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </>
  );
}