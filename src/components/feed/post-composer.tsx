"use client";

import { startTransition, useActionState, useDeferredValue, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Film, ImageUp, LoaderCircle, Search, X } from "lucide-react";
import { toast } from "sonner";
import { createPostAction } from "@/actions/feed";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { postCategoryOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ComposerFeedbackState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
  success?: boolean;
};

type GifPickerItem = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
};

type SelectedComposerImage = {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
};

const maxComposerImages = 5;
const supportedComposerImageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

const composerCategoryOptions = postCategoryOptions
  .filter((option) => option.value !== "POLL")
  .map((option) => ({
    value: option.value,
    label: option.label,
  }));

const gifUrlPattern = /(giphy\.com|media\d*\.giphy\.com|tenor\.com|\.gif(?:\?|$))/i;

function ComposerPendingOverlay({ imageCount }: { imageCount: number }) {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[1.5rem] bg-background/85 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {imageCount ? `Uploading ${imageCount} ${imageCount === 1 ? "image" : "images"} to storage...` : "Publishing post..."}
          </p>
          <p className="text-xs text-muted-foreground">
            Your post will appear at the top after the upload and save complete.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PostComposer({
  user,
  onPublished,
}: {
  user: { username: string; image?: string | null };
  onPublished?: () => void;
}) {
  const [state, formAction] = useActionState(createPostAction, undefined);
  const [category, setCategory] = useState("CONFESSION");
  const [selectedImages, setSelectedImages] = useState<SelectedComposerImage[]>([]);
  const [selectedGif, setSelectedGif] = useState<GifPickerItem | null>(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState<GifPickerItem[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const composerState = state as ComposerFeedbackState | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedImagesRef = useRef<SelectedComposerImage[]>([]);
  const deferredGifSearch = useDeferredValue(gifSearch);

  function syncImageInputFiles(images: SelectedComposerImage[]) {
    if (!fileInputRef.current) {
      return;
    }

    const transfer = new DataTransfer();

    for (const image of images) {
      transfer.items.add(image.file);
    }

    fileInputRef.current.files = transfer.files;
  }

  function resetSelectedImages(nextImages: SelectedComposerImage[] = []) {
    for (const image of selectedImagesRef.current) {
      if (!nextImages.some((nextImage) => nextImage.id === image.id)) {
        URL.revokeObjectURL(image.previewUrl);
      }
    }

    selectedImagesRef.current = nextImages;
    setSelectedImages(nextImages);
    syncImageInputFiles(nextImages);
  }

  function appendSelectedImages(files: File[]) {
    const validFiles = files.filter((file) => supportedComposerImageMimeTypes.has(file.type));

    if (!validFiles.length) {
      toast.error("Upload PNG, JPG, or WebP images.");
      return;
    }

    const existingImages = selectedImagesRef.current;
    const existingKeys = new Set(existingImages.map((image) => `${image.file.name}-${image.file.size}-${image.file.lastModified}`));
    const availableSlots = Math.max(maxComposerImages - existingImages.length, 0);

    if (!availableSlots) {
      toast.error(`You can attach up to ${maxComposerImages} images.`);
      return;
    }

    const nextImages = [...existingImages];

    for (const file of validFiles) {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

      if (existingKeys.has(fileKey)) {
        continue;
      }

      if (nextImages.length >= maxComposerImages) {
        break;
      }

      nextImages.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      });
      existingKeys.add(fileKey);
    }

    if (nextImages.length === existingImages.length) {
      toast.error("No new images were added.");
      return;
    }

    if (selectedGif) {
      setSelectedGif(null);
    }

    if (validFiles.length > availableSlots) {
      toast.message(`Only the first ${maxComposerImages} images were kept.`);
    }

    resetSelectedImages(nextImages);
  }

  function removeSelectedImage(imageId: string) {
    resetSelectedImages(selectedImagesRef.current.filter((image) => image.id !== imageId));
  }

  useEffect(() => {
    if (!composerState?.success) {
      return;
    }

    toast.success(composerState.message ?? "Post published.");
    onPublished?.();
  }, [composerState?.message, composerState?.success, onPublished]);

  useEffect(() => {
    return () => {
      for (const image of selectedImagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!gifPickerOpen) {
      return;
    }

    const controller = new AbortController();
    const query = deferredGifSearch.trim();

    async function loadGifs() {
      setGifLoading(true);
      setGifError(null);

      try {
        const response = await fetch(`/api/gifs${query ? `?query=${encodeURIComponent(query)}` : ""}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not load GIFs right now.");
        }

        const payload = (await response.json()) as { results: GifPickerItem[] };

        startTransition(() => {
          setGifResults(payload.results);
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setGifError(error instanceof Error ? error.message : "Could not load GIFs right now.");
      } finally {
        if (!controller.signal.aborted) {
          setGifLoading(false);
        }
      }
    }

    void loadGifs();

    return () => controller.abort();
  }, [deferredGifSearch, gifPickerOpen]);

  return (
    <form
      action={formAction}
      className="relative space-y-5 rounded-[1.5rem] border border-border/80 bg-card/95 p-5"
    >
      <ComposerPendingOverlay imageCount={selectedImages.length} />

      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border/70 bg-white/4">
          {user.image ? (
            <Image src={user.image} alt={user.username} fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-foreground">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{user.username}</p>
          <div className="mt-2 max-w-[14rem]">
            <Select
              id="composer-category"
              name="category"
              value={category}
              onValueChange={setCategory}
              options={composerCategoryOptions}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Textarea
          id="composer-content"
          name="content"
          placeholder={`What's on your mind, ${user.username}?`}
          className="min-h-40 border-0 bg-transparent px-0 text-lg leading-8 shadow-none focus-visible:ring-0"
          onPaste={(event) => {
            const clipboardItems = Array.from(event.clipboardData.items);
            const imageFiles = clipboardItems
              .filter((item) => item.kind === "file" && /image\/(png|jpeg|webp)/.test(item.type))
              .map((item) => item.getAsFile())
              .filter((file): file is File => Boolean(file));

            if (imageFiles.length) {
              event.preventDefault();

              appendSelectedImages(imageFiles);
              toast.success(`${imageFiles.length} ${imageFiles.length === 1 ? "image" : "images"} added to your post.`);
              return;
            }

            const pastedText = event.clipboardData.getData("text").trim();

            if (pastedText && gifUrlPattern.test(pastedText)) {
              event.preventDefault();
              resetSelectedImages();
              setSelectedGif({
                id: `pasted-${crypto.randomUUID()}`,
                title: "Pasted GIF",
                url: pastedText,
                previewUrl: pastedText,
              });
              toast.success("GIF attached to your post.");
            }
          }}
        />

        {composerState?.errors?.content ? (
          <p className="text-sm text-destructive">{composerState.errors.content[0]}</p>
        ) : null}
      </div>

      {selectedImages.length || selectedGif ? (
        <div className="space-y-3 rounded-[1.3rem] border border-border/70 bg-white/4 p-3">
          {selectedImages.length ? (
            <>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {selectedImages.length} / {maxComposerImages} images selected
                </span>
                <button
                  type="button"
                  onClick={() => resetSelectedImages()}
                  className="text-foreground transition-colors hover:text-primary"
                >
                  Clear images
                </button>
              </div>

              <div
                className={cn(
                  "grid gap-3",
                  selectedImages.length === 1 && "grid-cols-1",
                  selectedImages.length === 2 && "grid-cols-2",
                  selectedImages.length >= 3 && "grid-cols-2 md:grid-cols-3",
                )}
              >
                {selectedImages.map((image, index) => (
                  <div
                    key={image.id}
                    className={cn(
                      "relative overflow-hidden rounded-[1.15rem] border border-border/70",
                      selectedImages.length === 1 && "max-h-[24rem]",
                      selectedImages.length > 1 && "aspect-square",
                      selectedImages.length === 3 && index === 0 && "md:col-span-2",
                      selectedImages.length === 5 && index === 0 && "md:col-span-2 md:row-span-2",
                    )}
                  >
                    <Image
                      src={image.previewUrl}
                      alt={image.name || "Selected upload"}
                      width={1200}
                      height={900}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(image.id)}
                      className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
                      aria-label={`Remove ${image.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {selectedGif ? (
            <div className="relative overflow-hidden rounded-[1.15rem] border border-border/70">
              <Image
                src={selectedGif.previewUrl}
                alt={selectedGif.title || "Selected GIF"}
                width={1200}
                height={900}
                unoptimized
                className="max-h-[24rem] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedGif(null)}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
                aria-label="Remove GIF"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground">
                GIF attached
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <input type="hidden" name="gifUrl" value={selectedGif?.url ?? ""} />
      <input type="hidden" name="allowComments" value="on" />
      <input type="hidden" name="isAnonymous" value="off" />

      <div className="rounded-[1.3rem] border border-border/70 bg-white/4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/6"
          >
            <ImageUp className="h-4 w-4 text-primary" />
            Add images
          </button>

          <button
            type="button"
            onClick={() => setGifPickerOpen((current) => !current)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/6",
              gifPickerOpen && "border-primary/40 text-primary",
            )}
          >
            <Film className="h-4 w-4" />
            Choose GIF
          </button>

          <p className="text-xs text-muted-foreground sm:ml-auto">
            Add up to {maxComposerImages} images, or paste an image/GIF directly into the composer.
          </p>
        </div>

        <input
          ref={fileInputRef}
          id="composer-image-file"
          name="imageFiles"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            appendSelectedImages(files);
            event.target.value = "";
          }}
        />

        {selectedImages.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Attached images: {selectedImages.map((image) => image.name).join(", ")}
          </p>
        ) : null}

        {composerState?.errors?.imageFile ? (
          <p className="mt-3 text-sm text-destructive">{composerState.errors.imageFile[0]}</p>
        ) : null}

        {gifPickerOpen ? (
          <div className="mt-4 space-y-4 rounded-[1.2rem] border border-border/70 bg-background/90 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={gifSearch}
                onChange={(event) => setGifSearch(event.target.value)}
                placeholder="Search GIFs"
                className="pl-10"
              />
            </div>

            {gifError ? <p className="text-sm text-destructive">{gifError}</p> : null}

            {gifLoading ? <p className="text-sm text-muted-foreground">Loading GIFs...</p> : null}

            {!gifLoading && !gifError ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {gifResults.map((gif) => {
                  const isSelected = selectedGif?.id === gif.id;

                  return (
                    <button
                      key={gif.id}
                      type="button"
                      onClick={() => {
                        resetSelectedImages();
                        setSelectedGif(gif);
                        setGifPickerOpen(false);
                      }}
                      className={cn(
                        "overflow-hidden rounded-[1rem] border border-border/70 bg-white/4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30",
                        isSelected && "border-primary/40 ring-1 ring-primary/30",
                      )}
                    >
                      <Image
                        src={gif.previewUrl}
                        alt={gif.title}
                        width={320}
                        height={240}
                        unoptimized
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}

            {!gifLoading && !gifError && !gifResults.length ? (
              <p className="text-sm text-muted-foreground">No GIFs found for that search.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {composerState?.message ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {composerState.message}
        </div>
      ) : null}

      <SubmitButton
        size="lg"
        className="w-full"
        pendingLabel={
          selectedImages.length
            ? `Uploading ${selectedImages.length} ${selectedImages.length === 1 ? "image" : "images"}...`
            : "Posting..."
        }
      >
        Post
      </SubmitButton>
    </form>
  );
}
