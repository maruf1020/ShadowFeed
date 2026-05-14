"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { PostCategory } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { maxCommentReplyDepth } from "@/lib/constants";
import { deletePostImagesFromR2, optimizePostImageUploads, uploadPostImagesToR2 } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  commentSchema,
  pollVoteSchema,
  postFormSchema,
  reactionSchema,
} from "@/lib/validators/feed";
import { slugify } from "@/lib/utils";

export type ComposerState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
  success?: boolean;
  postSlug?: string;
  revealOnTop?: boolean;
};

const hashtagPattern = /#([a-z0-9][a-z0-9_-]{0,47})/gi;

function extractHashtagNames(parts: Array<string | undefined>) {
  const hashtagNames = new Set<string>();

  for (const part of parts) {
    if (!part) {
      continue;
    }

    for (const match of part.matchAll(hashtagPattern)) {
      const tagName = match[1]?.trim().toLowerCase();

      if (!tagName) {
        continue;
      }

      hashtagNames.add(tagName);

      if (hashtagNames.size >= 5) {
        return Array.from(hashtagNames);
      }
    }
  }

  return Array.from(hashtagNames);
}

async function syncPostMetrics(postId: string) {
  const [commentCount, reactionCount, pollVoteCount] = await Promise.all([
    prisma.comment.count({ where: { postId, status: "ACTIVE" } }),
    prisma.reaction.count({ where: { postId } }),
    prisma.pollVote.count({ where: { poll: { postId } } }),
  ]);

  await prisma.post.update({
    where: { id: postId },
    data: {
      commentCount,
      reactionCount,
      pollVoteCount,
      heatLevel: reactionCount * 10 + commentCount * 15 + pollVoteCount * 8,
      trendingScore: reactionCount * 1.25 + commentCount * 1.5 + pollVoteCount * 2,
    },
  });
}

export async function createPostAction(
  _previousState: ComposerState | undefined,
  formData: FormData,
): Promise<ComposerState> {
  const user = await requireUser();
  const uploadedImages = await optimizePostImageUploads(formData.getAll("imageFiles"));

  if (!uploadedImages.ok) {
    return {
      errors: { imageFile: [uploadedImages.error] },
      message: "Fix the composer fields and try again.",
      success: false,
    };
  }

  const storedImages = await uploadPostImagesToR2(uploadedImages.images, user.id);

  if (!storedImages.ok) {
    return {
      errors: { imageFile: [storedImages.error] },
      message: "Fix the composer fields and try again.",
      success: false,
    };
  }

  const parsed = postFormSchema.safeParse({
    category: formData.get("category"),
    title: String(formData.get("title") ?? "").trim() || undefined,
    content: String(formData.get("content") ?? "").trim(),
    gifUrl: String(formData.get("gifUrl") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    pollQuestion: String(formData.get("pollQuestion") ?? "").trim() || undefined,
    pollOptionOne: String(formData.get("pollOptionOne") ?? "").trim() || undefined,
    pollOptionTwo: String(formData.get("pollOptionTwo") ?? "").trim() || undefined,
    pollOptionThree: String(formData.get("pollOptionThree") ?? "").trim() || undefined,
    allowComments: formData.get("allowComments") === "on",
    isAnonymous: formData.get("isAnonymous") === "on",
    promoteAfterPublish: formData.get("promoteAfterPublish") === "on",
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the composer fields and try again.",
      success: false,
    };
  }

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent");
  const values = parsed.data;
  const tagNames = extractHashtagNames([
    values.title,
    values.content,
    values.pollQuestion,
    values.pollOptionOne,
    values.pollOptionTwo,
    values.pollOptionThree,
  ]);

  const slugBase = slugify(values.title || values.content.slice(0, 48)) || "shadowfeed-post";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`;

  try {
    const createdPost = await prisma.post.create({
      data: {
        authorId: user.id,
        category: values.category as PostCategory,
        title: values.title,
        slug,
        content: values.content,
        excerpt: values.content.slice(0, 180),
        gifUrl: values.gifUrl || undefined,
        imageUrl: storedImages.images[0]?.imageUrl,
        allowComments: values.allowComments,
        isAnonymous: values.isAnonymous,
        images: storedImages.images.length
          ? {
              create: storedImages.images.map((image, index) => ({
                imageUrl: image.imageUrl,
                storageKey: image.storageKey,
                width: image.width,
                height: image.height,
                displayOrder: index,
              })),
            }
          : undefined,
        tags: {
          create: await Promise.all(
            tagNames.map(async (tagName) => {
              const tag = await prisma.tag.upsert({
                where: { name: tagName },
                update: {},
                create: { name: tagName },
              });

              return { tagId: tag.id };
            }),
          ),
        },
        poll:
          values.category === "POLL"
            ? {
                create: {
                  question: values.pollQuestion!,
                  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                  options: {
                    create: [values.pollOptionOne, values.pollOptionTwo, values.pollOptionThree]
                      .filter(Boolean)
                      .map((option, index) => ({
                        label: option!,
                        displayOrder: index,
                      })),
                  },
                },
              }
            : undefined,
      },
    });

    await syncPostMetrics(createdPost.id);

    await logAuditEvent({
      userId: user.id,
      action: values.category === "POLL" ? "POLL_CREATED" : "POST_CREATED",
      entityType: "post",
      entityId: createdPost.id,
      details: {
        category: values.category,
        slug: createdPost.slug,
        imageStorage: storedImages.storageKind,
        imageCount: storedImages.images.length,
      },
      ipAddress,
      userAgent,
    });

    revalidatePath("/feed");

    return {
      message: "Post published.",
      success: true,
      postSlug: createdPost.slug,
      revealOnTop: values.isAnonymous && Boolean(values.promoteAfterPublish),
    };
  } catch {
    if (storedImages.images.length) {
      await deletePostImagesFromR2(storedImages.images.map((image) => image.storageKey));
    }

    return {
      errors: { imageFile: ["Could not finish publishing the post."] },
      message: "Fix the composer fields and try again.",
      success: false,
    };
  }
}

export async function toggleReactionAction(formData: FormData) {
  const user = await requireUser();
  const parsed = reactionSchema.safeParse({
    reactionType: formData.get("reactionType"),
    postId: String(formData.get("postId") ?? "") || undefined,
    commentId: String(formData.get("commentId") ?? "") || undefined,
  });

  if (!parsed.success) {
    return { ok: false };
  }

  const { commentId, postId, reactionType } = parsed.data;
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent");

  const existing = await prisma.reaction.findFirst({
    where: {
      userId: user.id,
      postId,
      commentId,
    },
  });

  if (existing?.type === reactionType) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.reaction.update({
      where: { id: existing.id },
      data: { type: reactionType },
    });
  } else {
    await prisma.reaction.create({
      data: {
        userId: user.id,
        type: reactionType,
        postId,
        commentId,
      },
    });
  }

  const targetPostId = postId
    ? postId
    : (
        await prisma.comment.findUnique({
          where: { id: commentId },
          select: { postId: true },
        })
      )?.postId;

  if (targetPostId) {
    await syncPostMetrics(targetPostId);
  }

  await logAuditEvent({
    userId: user.id,
    action: "REACTION_TOGGLED",
    entityType: commentId ? "comment" : "post",
    entityId: commentId ?? postId,
    details: {
      reactionType,
      toggledTo: existing?.type === reactionType ? "removed" : existing ? "changed" : "added",
    },
    ipAddress,
    userAgent,
  });

  return { ok: true };
}

export async function createCommentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    parentId: String(formData.get("parentId") ?? "") || undefined,
    content: String(formData.get("content") ?? "").trim(),
    gifUrl: String(formData.get("gifUrl") ?? "").trim(),
  });

  if (!parsed.success) {
    return { ok: false };
  }

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
    select: { allowComments: true },
  });

  if (!post?.allowComments) {
    return { ok: false };
  }

  if (parsed.data.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, postId: true, parentId: true },
    });

    if (!parentComment || parentComment.postId !== parsed.data.postId) {
      return { ok: false };
    }

    const parentDepth = parentComment.parentId ? 1 : 0;

    if (parentDepth >= maxCommentReplyDepth) {
      return { ok: false };
    }
  }

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent");

  const comment = await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      parentId: parsed.data.parentId,
      authorId: user.id,
      content: parsed.data.content,
      gifUrl: parsed.data.gifUrl || undefined,
      isAnonymous: true,
    },
  });

  await syncPostMetrics(parsed.data.postId);
  await logAuditEvent({
    userId: user.id,
    action: "COMMENT_CREATED",
    entityType: "comment",
    entityId: comment.id,
    details: {
      postId: parsed.data.postId,
      parentId: parsed.data.parentId,
    },
    ipAddress,
    userAgent,
  });

  return {
    ok: true,
    commentId: comment.id,
  };
}

export async function votePollAction(formData: FormData) {
  const user = await requireUser();
  const parsed = pollVoteSchema.safeParse({
    pollId: formData.get("pollId"),
    optionId: formData.get("optionId"),
  });

  if (!parsed.success) {
    return { ok: false };
  }

  const poll = await prisma.poll.findUnique({
    where: { id: parsed.data.pollId },
    include: {
      post: {
        select: { id: true },
      },
    },
  });

  if (!poll || (poll.expiresAt && poll.expiresAt < new Date())) {
    return { ok: false };
  }

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent");

  await prisma.pollVote.upsert({
    where: {
      pollId_userId: {
        pollId: parsed.data.pollId,
        userId: user.id,
      },
    },
    update: {
      optionId: parsed.data.optionId,
    },
    create: {
      pollId: parsed.data.pollId,
      optionId: parsed.data.optionId,
      userId: user.id,
    },
  });

  await syncPostMetrics(poll.post.id);
  await logAuditEvent({
    userId: user.id,
    action: "POLL_VOTED",
    entityType: "poll",
    entityId: parsed.data.pollId,
    details: {
      optionId: parsed.data.optionId,
    },
    ipAddress,
    userAgent,
  });

  return { ok: true };
}
