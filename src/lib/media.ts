import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

const maxUploadedImageBytes = 10 * 1024 * 1024;
const maxImageDimension = 1800;
const maxUploadedImagesPerPost = 5;
const supportedImageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

type PreparedImageUpload = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  optimization: "original" | "optimized";
  width: number;
  height: number;
};

type UploadedPostImage = {
  imageUrl: string;
  storageKey: string;
  width: number;
  height: number;
};

type OptimizePostImageUploadsResult =
  | {
      ok: true;
      images: PreparedImageUpload[];
      storageKind: "none" | "prepared-multi";
    }
  | {
      ok: false;
      error: string;
    };

type UploadPostImagesResult =
  | {
      ok: true;
      images: UploadedPostImage[];
      storageKind: "none" | "cloudflare-r2";
    }
  | {
      ok: false;
      error: string;
    };

function replaceFileExtension(fileName: string, extension: string) {
  const sanitizedName = fileName.trim() || `shadowfeed-image.${extension}`;
  return sanitizedName.replace(/\.[^.]+$/, "") + `.${extension}`;
}

function sanitizeObjectName(fileName: string) {
  return (fileName.trim() || "shadowfeed-image")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function buildPostImageKey(fileName: string, creatorId: string) {
  const safeName = sanitizeObjectName(fileName);
  return `posts/${creatorId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
}

function buildPostImageProxyUrl(objectKey: string) {
  return `/api/media/posts/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.CLOUDFLARE_R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey || !endpoint) {
    return undefined;
  }

  return {
    accountId,
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
  };
}

function createR2Client() {
  const config = getR2Config();

  if (!config) {
    return undefined;
  }

  return {
    client: new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
    config,
  };
}

export async function optimizePostImageUpload(fileEntry: FormDataEntryValue | null) {
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { image: undefined, storageKind: "none" as const };
  }

  if (!supportedImageMimeTypes.has(fileEntry.type)) {
    return { error: "Upload a PNG, JPG, or WebP image." };
  }

  if (fileEntry.size > maxUploadedImageBytes) {
    return { error: "Upload an image smaller than 8 MB." };
  }

  const inputBuffer = Buffer.from(await fileEntry.arrayBuffer());
  const metadata = await sharp(inputBuffer).metadata();
  const needsResize =
    (metadata.width ?? 0) > maxImageDimension || (metadata.height ?? 0) > maxImageDimension;

  const optimizedBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: maxImageDimension,
      height: maxImageDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    // Keep visual quality high while reducing size via modern encoding and metadata stripping.
    .webp({ quality: 88, alphaQuality: 90, effort: 4 })
    .toBuffer();

  const useOriginal = !needsResize && optimizedBuffer.byteLength >= inputBuffer.byteLength;
  const finalBuffer = useOriginal ? inputBuffer : optimizedBuffer;
  const finalMimeType = useOriginal ? fileEntry.type : "image/webp";
  const finalFileName = useOriginal ? fileEntry.name : replaceFileExtension(fileEntry.name, "webp");
  const finalMetadata = useOriginal ? metadata : await sharp(finalBuffer).metadata();

  return {
    image: {
      buffer: finalBuffer,
      mimeType: finalMimeType,
      fileName: finalFileName,
      optimization: useOriginal ? "original" : "optimized",
      width: finalMetadata.width ?? metadata.width ?? 1,
      height: finalMetadata.height ?? metadata.height ?? 1,
    } satisfies PreparedImageUpload,
    storageKind: useOriginal ? ("prepared-original" as const) : ("prepared-optimized" as const),
  };
}

export async function optimizePostImageUploads(
  fileEntries: FormDataEntryValue[],
): Promise<OptimizePostImageUploadsResult> {
  const uploadFiles = fileEntries.filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!uploadFiles.length) {
    return { ok: true, images: [] as PreparedImageUpload[], storageKind: "none" as const };
  }

  if (uploadFiles.length > maxUploadedImagesPerPost) {
    return {
      ok: false,
      error: `Upload up to ${maxUploadedImagesPerPost} images per post.`,
    };
  }

  const preparedImages: PreparedImageUpload[] = [];

  for (const uploadFile of uploadFiles) {
    const preparedImage = await optimizePostImageUpload(uploadFile);

    if (preparedImage.error) {
      return { ok: false, error: preparedImage.error };
    }

    if (preparedImage.image) {
      preparedImages.push(preparedImage.image);
    }
  }

  return {
    ok: true,
    images: preparedImages,
    storageKind: "prepared-multi" as const,
  };
}

export async function uploadPostImageToR2(
  preparedImage: PreparedImageUpload | undefined,
  creatorId: string,
) {
  if (!preparedImage) {
    return { imageUrl: undefined, storageKind: "none" as const };
  }

  const r2 = createR2Client();

  if (!r2) {
    return {
      error:
        "Cloudflare R2 is not configured. Add CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.",
    };
  }

  const objectKey = buildPostImageKey(preparedImage.fileName, creatorId);

  try {
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.config.bucket,
        Key: objectKey,
        Body: preparedImage.buffer,
        ContentType: preparedImage.mimeType,
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: {
          creatorid: creatorId,
          optimization: preparedImage.optimization,
        },
      }),
    );

    return {
      imageUrl: buildPostImageProxyUrl(objectKey),
      storageKind:
        preparedImage.optimization === "optimized"
          ? ("cloudflare-r2-optimized" as const)
          : ("cloudflare-r2-original" as const),
    };
  } catch {
    return {
      error: "Could not upload the image to Cloudflare R2.",
    };
  }
}

export async function uploadPostImagesToR2(
  preparedImages: PreparedImageUpload[],
  creatorId: string,
): Promise<UploadPostImagesResult> {
  if (!preparedImages.length) {
    return {
      ok: true,
      images: [] as UploadedPostImage[],
      storageKind: "none" as const,
    };
  }

  const r2 = createR2Client();

  if (!r2) {
    return {
      ok: false,
      error:
        "Cloudflare R2 is not configured. Add CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.",
    };
  }

  const uploadedImages: UploadedPostImage[] = [];

  try {
    for (const preparedImage of preparedImages) {
      const objectKey = buildPostImageKey(preparedImage.fileName, creatorId);

      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.config.bucket,
          Key: objectKey,
          Body: preparedImage.buffer,
          ContentType: preparedImage.mimeType,
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: {
            creatorid: creatorId,
            optimization: preparedImage.optimization,
          },
        }),
      );

      uploadedImages.push({
        imageUrl: buildPostImageProxyUrl(objectKey),
        storageKey: objectKey,
        width: preparedImage.width,
        height: preparedImage.height,
      });
    }

    return {
      ok: true,
      images: uploadedImages,
      storageKind: "cloudflare-r2" as const,
    };
  } catch {
    if (uploadedImages.length) {
      await deletePostImagesFromR2(uploadedImages.map((image) => image.storageKey));
    }

    return {
      ok: false,
      error: "Could not upload the images to Cloudflare R2.",
    };
  }
}

export async function deletePostImagesFromR2(objectKeys: string[]) {
  const r2 = createR2Client();

  if (!r2 || !objectKeys.length) {
    return;
  }

  await Promise.allSettled(
    Array.from(new Set(objectKeys.filter(Boolean))).map(async (objectKey) => {
      await r2.client.send(
        new DeleteObjectCommand({
          Bucket: r2.config.bucket,
          Key: objectKey,
        }),
      );
    }),
  );
}

export async function getPostImageFromR2(objectKey: string) {
  const r2 = createR2Client();

  if (!r2) {
    return {
      error:
        "Cloudflare R2 is not configured. Add CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.",
      status: 500 as const,
    };
  }

  try {
    const response = await r2.client.send(
      new GetObjectCommand({
        Bucket: r2.config.bucket,
        Key: objectKey,
      }),
    );

    if (!response.Body) {
      return {
        error: "R2 returned an empty object body.",
        status: 404 as const,
      };
    }

    return {
      body: new Uint8Array(await response.Body.transformToByteArray()),
      contentType: response.ContentType ?? "application/octet-stream",
      cacheControl: response.CacheControl ?? "public, max-age=31536000, immutable",
      etag: response.ETag,
      lastModified: response.LastModified?.toUTCString(),
      status: 200 as const,
    };
  } catch (error) {
    if (error instanceof S3ServiceException && error.name === "NoSuchKey") {
      return {
        error: "Image not found.",
        status: 404 as const,
      };
    }

    return {
      error: "Could not load the image from Cloudflare R2.",
      status: 500 as const,
    };
  }
}