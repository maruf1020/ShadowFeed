"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { logAuditEvent } from "@/lib/audit";
import { deletePostImagesFromR2 } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function moderatePostAction(formData: FormData) {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const status = String(formData.get("status") ?? "");
  const requestHeaders = await headers();

  if (!postId || !["ACTIVE", "HIDDEN", "REMOVED"].includes(status)) {
    return;
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      images: {
        select: {
          storageKey: true,
        },
      },
    },
  });

  if (!post) {
    return;
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status: status as "ACTIVE" | "HIDDEN" | "REMOVED" },
  });

  const imageStorageKeys = post.images
    .map((image) => image.storageKey)
    .filter((storageKey): storageKey is string => Boolean(storageKey));

  if (status === "REMOVED" && imageStorageKeys.length) {
    await deletePostImagesFromR2(imageStorageKeys);
  }

  await logAuditEvent({
    userId: admin.id,
    action: status === "REMOVED" ? "POST_DELETED" : "POST_UPDATED",
    entityType: "post",
    entityId: postId,
    details: { moderationStatus: status },
    ipAddress: requestHeaders.get("x-forwarded-for"),
    userAgent: requestHeaders.get("user-agent"),
  });

  revalidatePath("/feed");
  revalidatePath("/admin");
}

export async function toggleUserSuspensionAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const requestHeaders = await headers();

  if (!userId || !["restore", "suspend", "ban"].includes(mode)) {
    return;
  }

  if (mode === "restore") {
    await prisma.suspension.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, endsAt: new Date() },
    });
  } else {
    await prisma.suspension.create({
      data: {
        userId,
        type: mode === "ban" ? "BANNED" : "SUSPENDED",
        reason:
          mode === "ban"
            ? "Admin ban from moderation dashboard"
            : "Admin suspension from moderation dashboard",
      },
    });
  }

  await logAuditEvent({
    userId: admin.id,
    action:
      mode === "restore"
        ? "ADMIN_NOTE_ADDED"
        : mode === "ban"
          ? "USER_BANNED"
          : "USER_SUSPENDED",
    entityType: "user",
    entityId: userId,
    details: { mode },
    ipAddress: requestHeaders.get("x-forwarded-for"),
    userAgent: requestHeaders.get("user-agent"),
  });
}
