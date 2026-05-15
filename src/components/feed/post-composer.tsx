"use client";

import { startTransition, useActionState, useDeferredValue, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { EyeOff, Film, Globe2, Hash, ImageUp, LayoutGrid, LoaderCircle, Search, X } from "lucide-react";
import { toast } from "sonner";
import { createPostAction } from "@/actions/feed";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultTags, postCategoryOptions } from "@/lib/constants";
import { cn, slugify } from "@/lib/utils";

type ComposerFeedbackState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
  success?: boolean;
  postSlug?: string;
  revealOnTop?: boolean;
};

type ComposerPublishPayload = {
  postSlug?: string;
  revealOnTop?: boolean;
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

type ComposerActiveTool = "gif" | "category" | "hashtag";

const maxComposerImages = 5;
const supportedComposerImageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

const composerCategoryOptions = postCategoryOptions
  .filter((option) => option.value !== "POLL")
  .map((option) => ({
    value: option.value,
    label: option.label,
  }))
  .sort((left, right) => left.label.localeCompare(right.label));

const hashtagQuickPickTags = defaultTags.slice(0, 8);

const gifUrlPattern = /(giphy\.com|media\d*\.giphy\.com|tenor\.com|\.gif(?:\?|$))/i;

function ComposerPendingOverlay({ imageCount }: { imageCount: number }) {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-background/85 backdrop-blur-sm">
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
  defaultAnonymous = false,
  defaultPromoteAnonymousPosts = true,
  onPublished,
}: {
  user: { username: string; image?: string | null };
  defaultAnonymous?: boolean;
  defaultPromoteAnonymousPosts?: boolean;
  onPublished?: (payload?: ComposerPublishPayload) => void;
}) {
  const [state, formAction] = useActionState(createPostAction, undefined);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [isAnonymous, setIsAnonymous] = useState(defaultAnonymous);
  const [promoteAfterPublish] = useState(defaultPromoteAnonymousPosts);
  const [selectedImages, setSelectedImages] = useState<SelectedComposerImage[]>([]);
  const [selectedGif, setSelectedGif] = useState<GifPickerItem | null>(null);
  const [activeTool, setActiveTool] = useState<ComposerActiveTool | null>(null);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState<GifPickerItem[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [hashtagInput, setHashtagInput] = useState("");
  const composerState = state as ComposerFeedbackState | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedImagesRef = useRef<SelectedComposerImage[]>([]);
  const toolPanelRef = useRef<HTMLDivElement>(null);
  const deferredGifSearch = useDeferredValue(gifSearch);
  const selectedCategory = composerCategoryOptions.find((option) => option.value === category) ?? composerCategoryOptions[0];
  const gifPickerOpen = activeTool === "gif";
  const categoryMenuOpen = activeTool === "category";
  const hashtagMenuOpen = activeTool === "hashtag";

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

  function toggleActiveTool(nextTool: ComposerActiveTool) {
    setActiveTool((current) => (current === nextTool ? null : nextTool));
  }

  function appendHashtag(rawValue: string) {
    const nextValue = slugify(rawValue);

    if (!nextValue) {
      toast.error("Add a hashtag first.");
      return;
    }

    const nextHashtag = `#${nextValue}`;

    setContent((current) => {
      const trimmed = current.trimEnd();
      return trimmed ? `${trimmed} ${nextHashtag}` : nextHashtag;
    });

    setHashtagInput("");
    setActiveTool(null);
  }

  useEffect(() => {
    if (!composerState?.success) {
      return;
    }

    toast.success(composerState.message ?? "Post published.");
    onPublished?.({
      postSlug: composerState.postSlug,
      revealOnTop: composerState.revealOnTop,
    });
  }, [composerState?.message, composerState?.postSlug, composerState?.revealOnTop, composerState?.success, onPublished]);

  useEffect(() => {
    return () => {
      for (const image of selectedImagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!toolPanelRef.current?.contains(event.target as Node)) {
        setActiveTool(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveTool(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
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
      className="relative space-y-4 overflow-hidden rounded-[1.55rem] border border-border/80 bg-card/95 p-4 sm:p-5"
    >
      <ComposerPendingOverlay imageCount={selectedImages.length} />

      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="gifUrl" value={selectedGif?.url ?? ""} />
      <input type="hidden" name="allowComments" value="on" />
      <input type="hidden" name="isAnonymous" value={isAnonymous ? "on" : "off"} />
      <input type="hidden" name="promoteAfterPublish" value={isAnonymous && promoteAfterPublish ? "on" : "off"} />

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-full border border-border/70 bg-white/4">
            {user.image && !isAnonymous ? (
              <Image src={user.image} alt={user.username} fill sizes="44px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-foreground">
                {isAnonymous ? "AN" : user.username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user.username}</p>
            <p className="truncate text-xs text-muted-foreground">
              {isAnonymous ? "Posting anonymously" : `Posting as @${user.username}`} · {selectedCategory.label}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAnonymous((current) => !current)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors",
            isAnonymous
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/70 bg-background/70 text-foreground hover:bg-white/6",
          )}
          aria-pressed={isAnonymous}
        >
          {isAnonymous ? <EyeOff className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
          <span>{isAnonymous ? "Anonymous" : "Named"}</span>
        </button>
      </div>

      <div className="space-y-2">
        <Textarea
          id="composer-content"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={isAnonymous ? "What's on your mind?" : `What's on your mind, ${user.username}?`}
          className="min-h-44 rounded-none border-0 bg-transparent px-0 py-2 text-[1.6rem] leading-tight shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-0"
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
        <div className="space-y-3 rounded-[1.2rem] border border-border/70 bg-white/4 p-3">
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
                      selectedImages.length === 1 && "max-h-96",
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
                className="max-h-96 w-full object-cover"
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

      <div ref={toolPanelRef} className="space-y-3 rounded-[1.2rem] border border-border/70 bg-white/4 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTool(null);
                fileInputRef.current?.click();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/6"
            >
              <ImageUp className="h-4 w-4 text-primary" />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => toggleActiveTool("gif")}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/6",
                gifPickerOpen && "border-primary/40 bg-primary/10 text-primary",
              )}
            >
              <Film className="h-4 w-4" />
              <span>GIF</span>
            </button>

            <button
              type="button"
              onClick={() => toggleActiveTool("category")}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/6",
                categoryMenuOpen && "border-primary/40 bg-primary/10 text-primary",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Category</span>
            </button>

            <button
              type="button"
              onClick={() => toggleActiveTool("hashtag")}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/6",
                hashtagMenuOpen && "border-primary/40 bg-primary/10 text-primary",
              )}
            >
              <Hash className="h-4 w-4" />
              <span>Hashtag</span>
            </button>
          </div>

          <SubmitButton
            size="lg"
            className="w-full sm:w-auto sm:min-w-28"
            pendingLabel={
              selectedImages.length
                ? `Uploading ${selectedImages.length} ${selectedImages.length === 1 ? "image" : "images"}...`
                : "Posting..."
            }
          >
            Post
          </SubmitButton>
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
          }}
        />

        {composerState?.errors?.imageFile ? (
          <p className="text-sm text-destructive">{composerState.errors.imageFile[0]}</p>
        ) : null}

        {categoryMenuOpen ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {composerCategoryOptions.map((option) => {
              const isSelected = option.value === category;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setCategory(option.value);
                    setActiveTool(null);
                  }}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border/70 bg-background/80 text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {gifPickerOpen ? (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/90 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={gifSearch}
                onChange={(event) => setGifSearch(event.target.value)}
                placeholder="Search GIFs"
                className="h-11 rounded-full border-border/70 bg-background pl-10"
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
                        setActiveTool(null);
                      }}
                      className={cn(
                        "overflow-hidden rounded-2xl border border-border/70 bg-white/4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30",
                        isSelected && "border-primary/40 ring-1 ring-primary/30",
                      )}
                    >
                      <Image
                        src={gif.previewUrl}
                        alt={gif.title}
                        width={320}
                        height={240}
                        unoptimized
                        className="aspect-4/3 w-full object-cover"
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

        {hashtagMenuOpen ? (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/90 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={hashtagInput}
                onChange={(event) => setHashtagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    appendHashtag(hashtagInput);
                  }
                }}
                placeholder="Add hashtag"
                className="h-11 rounded-full border-border/70 bg-background"
              />
              <button
                type="button"
                onClick={() => appendHashtag(hashtagInput)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/6"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {hashtagQuickPickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendHashtag(tag)}
                  className="inline-flex h-9 items-center rounded-full border border-border/70 bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {composerState?.message ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {composerState.message}
        </div>
      ) : null}
    </form>
  );
}