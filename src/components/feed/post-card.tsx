"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { toggleReactionAction, votePollAction } from "@/actions/feed";
import { CommentForm, type PendingCommentInput } from "@/components/feed/comment-form";
import { CommentThread, type CommentTreeNode } from "@/components/feed/comment-thread";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reactionOptions } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

export type FeedPost = {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  content: string;
  gifUrl: string | null;
  imageUrl: string | null;
  allowComments: boolean;
  isAnonymous: boolean;
  createdAt: Date;
  author: {
    publicProfile: {
      username: string;
      fakeEmail: string;
      avatarUrl: string | null;
    } | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  reactions: Array<{
    id: string;
    type: string;
    userId: string;
  }>;
  comments: CommentTreeNode[];
  poll: {
    id: string;
    question: string;
    expiresAt: Date | null;
    votes: Array<{
      userId: string;
      optionId: string;
    }>;
    options: Array<{
      id: string;
      label: string;
      votes: Array<{
        userId: string;
      }>;
    }>;
  } | null;
};

function getRootComments(comments: CommentTreeNode[]) {
  return comments.filter((comment) => !comment.parentId);
}

function countComments(comments: CommentTreeNode[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0);
}

function toggleReactionList(
  reactions: FeedPost["reactions"],
  userId: string,
  reactionType: string,
  scopeId: string,
) {
  const existingReaction = reactions.find((reaction) => reaction.userId === userId && reaction.type === reactionType);

  if (existingReaction) {
    return reactions.filter((reaction) => reaction.id !== existingReaction.id);
  }

  return [
    ...reactions,
    {
      id: `optimistic-${scopeId}-${reactionType}-${userId}`,
      type: reactionType,
      userId,
    },
  ];
}

function addCommentToTree(comments: CommentTreeNode[], newComment: CommentTreeNode): CommentTreeNode[] {
  if (!newComment.parentId) {
    return [...comments, newComment];
  }

  return comments.map((comment) => {
    if (comment.id === newComment.parentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), newComment],
      };
    }

    const replies = comment.replies ?? [];
    return {
      ...comment,
      replies: addCommentToTree(replies, newComment),
    };
  });
}

function replaceCommentId(comments: CommentTreeNode[], tempId: string, commentId: string): CommentTreeNode[] {
  return comments.map((comment) => {
    if (comment.id === tempId) {
      return {
        ...comment,
        id: commentId,
      };
    }

    return {
      ...comment,
      replies: replaceCommentId(comment.replies ?? [], tempId, commentId),
    };
  });
}

function removeCommentFromTree(comments: CommentTreeNode[], commentId: string): CommentTreeNode[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: removeCommentFromTree(comment.replies ?? [], commentId),
    }));
}

function toggleCommentReaction(
  comments: CommentTreeNode[],
  commentId: string,
  userId: string,
  reactionType: string,
): CommentTreeNode[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return {
        ...comment,
        reactions: toggleReactionList(comment.reactions, userId, reactionType, comment.id),
      };
    }

    return {
      ...comment,
      replies: toggleCommentReaction(comment.replies ?? [], commentId, userId, reactionType),
    };
  });
}

function applyPollVote(poll: NonNullable<FeedPost["poll"]>, optionId: string, userId: string) {
  const existingVote = poll.votes.find((vote) => vote.userId === userId);
  const nextVotes = existingVote
    ? poll.votes.map((vote) => (vote.userId === userId ? { ...vote, optionId } : vote))
    : [...poll.votes, { userId, optionId }];

  return {
    ...poll,
    votes: nextVotes,
    options: poll.options.map((option) => {
      const optionVotes = option.votes.filter((vote) => vote.userId !== userId);

      return option.id === optionId
        ? {
            ...option,
            votes: [...optionVotes, { userId }],
          }
        : {
            ...option,
            votes: optionVotes,
          };
    }),
  };
}

export function PostCard({
  post,
  currentUserId,
  onPostActivity,
}: {
  post: FeedPost;
  currentUserId: string;
  onPostActivity?: (postId: string) => void;
}) {
  const [postState, setPostState] = useState<FeedPost>(() => ({
    ...post,
    comments: getRootComments(post.comments),
  }));

  const displayName = postState.isAnonymous
    ? "Anonymous Echo"
    : postState.author.publicProfile?.username ?? "Shadow user";
  const groupedReactions = reactionOptions.map((reaction) => ({
    ...reaction,
    count: postState.reactions.filter((item) => item.type === reaction.value).length,
  }));
  const currentVote = postState.poll?.votes.find((vote) => vote.userId === currentUserId)?.optionId;
  const totalVotes = postState.poll?.votes.length ?? 0;
  const commentCount = countComments(postState.comments);

  function handleOptimisticComment(comment: PendingCommentInput) {
    const optimisticComment: CommentTreeNode = {
      id: comment.tempId,
      postId: postState.id,
      parentId: comment.parentId ?? null,
      content: comment.content,
      gifUrl: comment.gifUrl,
      isAnonymous: true,
      createdAt: new Date(),
      author: {
        publicProfile: null,
      },
      reactions: [],
      replies: [],
    };

    setPostState((currentPost) => ({
      ...currentPost,
      comments: addCommentToTree(currentPost.comments, optimisticComment),
    }));
  }

  function handleCommentConfirmed(tempId: string, commentId: string) {
    setPostState((currentPost) => ({
      ...currentPost,
      comments: replaceCommentId(currentPost.comments, tempId, commentId),
    }));
  }

  function handleCommentRejected(tempId: string) {
    setPostState((currentPost) => ({
      ...currentPost,
      comments: removeCommentFromTree(currentPost.comments, tempId),
    }));
  }

  async function handleCommentReaction(commentId: string, formData: FormData) {
    let previousPost = postState;

    setPostState((currentPost) => {
      previousPost = currentPost;

      return {
        ...currentPost,
        comments: toggleCommentReaction(currentPost.comments, commentId, currentUserId, "LAUGH"),
      };
    });
    onPostActivity?.(postState.id);

    try {
      const result = await toggleReactionAction(formData);

      if (!result?.ok) {
        setPostState(previousPost);
        toast.error("Could not update that comment reaction.");
      }
    } catch {
      setPostState(previousPost);
      toast.error("Could not update that comment reaction.");
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="gap-5 border-b border-border/70 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={postState.author.publicProfile?.avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-foreground">{displayName}</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(postState.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{postState.category.replaceAll("_", " ")}</Badge>
                {postState.tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="muted">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-full border border-border/80 bg-white/4 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            {postState.allowComments ? "comments on" : "comments locked"}
          </div>
        </div>

        {postState.title ? <CardTitle className="text-2xl">{postState.title}</CardTitle> : null}
      </CardHeader>

      <CardContent className="space-y-6 px-6 py-6">
        <MarkdownRenderer content={postState.content} />

        {postState.gifUrl ? (
          <Image
            src={postState.gifUrl}
            alt="Post GIF"
            width={800}
            height={450}
            unoptimized
            className="max-h-96 rounded-[1.4rem] border border-border/70 object-cover"
          />
        ) : null}

        {postState.imageUrl ? (
          <Image
            src={postState.imageUrl}
            alt="Post attachment"
            width={800}
            height={450}
            unoptimized
            className="max-h-96 rounded-[1.4rem] border border-border/70 object-cover"
          />
        ) : null}

        {postState.poll ? (
          <div className="rounded-[1.4rem] border border-primary/20 bg-primary/7 p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Poll</p>
                <h3 className="mt-2 text-lg font-medium text-foreground">{postState.poll.question}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{totalVotes} votes</p>
            </div>

            <div className="space-y-3">
              {postState.poll.options.map((option) => {
                const count = option.votes.length;
                const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

                return (
                  <form
                    key={option.id}
                    action={async (formData) => {
                      let previousPost = postState;

                      setPostState((currentPost) => {
                        previousPost = currentPost;

                        return {
                          ...currentPost,
                          poll: currentPost.poll ? applyPollVote(currentPost.poll, option.id, currentUserId) : null,
                        };
                      });
                      onPostActivity?.(postState.id);

                      try {
                        const result = await votePollAction(formData);

                        if (!result?.ok) {
                          setPostState(previousPost);
                          toast.error("Could not save that vote.");
                        }
                      } catch {
                        setPostState(previousPost);
                        toast.error("Could not save that vote.");
                      }
                    }}
                    className="space-y-2"
                  >
                    <input type="hidden" name="pollId" value={postState.poll!.id} />
                    <input type="hidden" name="optionId" value={option.id} />
                    <button className="w-full rounded-2xl border border-border/70 bg-black/20 px-4 py-3 text-left transition-colors hover:bg-black/30">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-secondary-foreground">{option.label}</span>
                        <span className="font-mono text-primary">
                          {currentVote === option.id ? "voted" : `${percent}%`}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {groupedReactions.map((reaction) => (
            <form
              key={reaction.value}
              action={async (formData) => {
                let previousPost = postState;

                setPostState((currentPost) => {
                  previousPost = currentPost;

                  return {
                    ...currentPost,
                    reactions: toggleReactionList(currentPost.reactions, currentUserId, reaction.value, currentPost.id),
                  };
                });
                onPostActivity?.(postState.id);

                try {
                  const result = await toggleReactionAction(formData);

                  if (!result?.ok) {
                    setPostState(previousPost);
                    toast.error("Could not update that reaction.");
                  }
                } catch {
                  setPostState(previousPost);
                  toast.error("Could not update that reaction.");
                }
              }}
            >
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="reactionType" value={reaction.value} />
              <Button variant="secondary" size="sm">
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </Button>
            </form>
          ))}
        </div>

        <div className="space-y-5 rounded-[1.4rem] border border-border/70 bg-white/4 p-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-medium text-foreground">
              Comments ({commentCount})
            </h3>
            {!postState.allowComments ? (
              <span className="text-sm text-muted-foreground">Author locked comments</span>
            ) : null}
          </div>

          {postState.allowComments ? (
            <CommentForm
              postId={postState.id}
              onCommentOptimistic={handleOptimisticComment}
              onCommentConfirmed={handleCommentConfirmed}
              onCommentRejected={handleCommentRejected}
              onPostActivity={() => onPostActivity?.(postState.id)}
            />
          ) : null}
          <CommentThread
            comments={postState.comments}
            onCommentOptimistic={handleOptimisticComment}
            onCommentConfirmed={handleCommentConfirmed}
            onCommentRejected={handleCommentRejected}
            onToggleCommentReaction={handleCommentReaction}
            onPostActivity={() => onPostActivity?.(postState.id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
