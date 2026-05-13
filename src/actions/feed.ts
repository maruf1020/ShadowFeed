"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { PostCategory } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { maxCommentReplyDepth } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  commentSchema,
  pollVoteSchema,
  postFormSchema,
  reactionSchema,
} from "@/lib/validators/feed";
import { slugify } from "@/lib/utils";

type ComposerState = {
  message?: string;
  errors?: Record<string, string[]>;
};

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
) {
  const user = await requireUser();
  const parsed = postFormSchema.safeParse({
    category: formData.get("category"),
    title: String(formData.get("title") ?? "").trim() || undefined,
    content: String(formData.get("content") ?? "").trim(),
    gifUrl: String(formData.get("gifUrl") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    tags: String(formData.get("tags") ?? "").trim() || undefined,
    pollQuestion: String(formData.get("pollQuestion") ?? "").trim() || undefined,
    pollOptionOne: String(formData.get("pollOptionOne") ?? "").trim() || undefined,
    pollOptionTwo: String(formData.get("pollOptionTwo") ?? "").trim() || undefined,
    pollOptionThree: String(formData.get("pollOptionThree") ?? "").trim() || undefined,
    allowComments: formData.get("allowComments") === "on",
    isAnonymous: formData.get("isAnonymous") !== "off",
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the composer fields and try again.",
    };
  }

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent");
  const values = parsed.data;
  const tagNames = Array.from(
    new Set(
      (values.tags ?? "")
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 5);

  const slugBase = slugify(values.title || values.content.slice(0, 48)) || "shadowfeed-post";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`;

  const createdPost = await prisma.post.create({
    data: {
      authorId: user.id,
      category: values.category as PostCategory,
      title: values.title,
      slug,
      content: values.content,
      excerpt: values.content.slice(0, 180),
      gifUrl: values.gifUrl || undefined,
      imageUrl: values.imageUrl || undefined,
      allowComments: values.allowComments,
      isAnonymous: values.isAnonymous,
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
    },
    ipAddress,
    userAgent,
  });

  revalidatePath("/feed");

  return {
    message: "Post published.",
  };
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
      type: reactionType,
      postId,
      commentId,
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
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
      toggledTo: existing ? "removed" : "added",
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
