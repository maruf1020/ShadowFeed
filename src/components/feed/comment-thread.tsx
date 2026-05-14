"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, CornerDownRight } from "lucide-react";
import { CommentForm, type PendingCommentInput } from "@/components/feed/comment-form";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { reactionOptions } from "@/lib/constants";
import { maxCommentReplyDepth } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";

const commentReactionMap = new Map<string, { emoji: string; label: string }>(
  reactionOptions.map((reaction) => [reaction.value, reaction]),
);

function getCommentReactionMeta(reactionType: string) {
  return commentReactionMap.get(reactionType) ?? { emoji: reactionType, label: reactionType };
}

export type CommentTreeNode = {
  id: string;
  postId: string;
  parentId?: string | null;
  content: string;
  gifUrl: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  author: {
    publicProfile: {
      username: string;
      avatarUrl: string | null;
    } | null;
  };
  reactions: Array<{
    id: string;
    type: string;
    userId: string;
    createdAt: Date;
    user: {
      publicProfile: {
        username: string;
        avatarUrl: string | null;
      } | null;
    };
  }>;
  replies?: CommentTreeNode[];
};

type CommentThreadProps = {
  comments: CommentTreeNode[];
  currentUserId: string;
  depth?: number;
  onCommentOptimistic: (comment: PendingCommentInput) => void;
  onCommentConfirmed: (tempId: string, commentId: string) => void;
  onCommentRejected: (tempId: string) => void;
  onToggleCommentReaction: (commentId: string, reactionType: string) => Promise<void>;
  onPostActivity: () => void;
};

function CommentItem({
  comment,
  currentUserId,
  depth,
  onCommentOptimistic,
  onCommentConfirmed,
  onCommentRejected,
  onToggleCommentReaction,
  onPostActivity,
}: {
  comment: CommentTreeNode;
  currentUserId: string;
  depth: number;
  onCommentOptimistic: (comment: PendingCommentInput) => void;
  onCommentConfirmed: (tempId: string, commentId: string) => void;
  onCommentRejected: (tempId: string) => void;
  onToggleCommentReaction: (commentId: string, reactionType: string) => Promise<void>;
  onPostActivity: () => void;
}) {
  const replies = comment.replies ?? [];
  const displayName = comment.isAnonymous ? "Anonymous Echo" : comment.author.publicProfile?.username ?? "Shadow user";
  const currentReaction = comment.reactions.find((reaction) => reaction.userId === currentUserId) ?? null;
  const summaryReaction = comment.reactions[comment.reactions.length - 1] ?? null;
  const summaryReactionMeta = summaryReaction ? getCommentReactionMeta(summaryReaction.type) : null;
  const reactionCount = comment.reactions.length;
  const [replyOpen, setReplyOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const reactionToggleType = currentReaction?.type ?? "👍";
  const reactionButtonLabel = currentReaction ? (currentReaction.type === "👍" ? "Liked" : "Reacted") : "Like";

  return (
    <div className={cn("relative flex gap-3", depth > 0 && "pl-5") }>
      {depth > 0 ? <div className="absolute bottom-0 left-[1rem] top-0 w-px rounded-full bg-border/70" /> : null}

      <div className="relative z-10 pt-1">
        <Avatar className="h-10 w-10 border border-border/70 shadow-sm">
          <AvatarImage src={comment.author.publicProfile?.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="relative rounded-[1.45rem] border border-border/70 bg-card/95 px-4 py-3 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.55)]">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{displayName}</span>
            {comment.isAnonymous ? (
              <span className="rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Anonymous
              </span>
            ) : null}
          </div>

          <div className="mt-2 text-sm leading-6 text-foreground">
            <MarkdownRenderer content={comment.content} />
          </div>

          {comment.gifUrl ? (
            <Image
              src={comment.gifUrl}
              alt="Comment GIF"
              width={640}
              height={360}
              unoptimized
              className="mt-3 max-h-64 rounded-2xl border border-border/70 object-cover"
            />
          ) : null}

          {reactionCount ? (
            <div className="absolute -bottom-3 right-4 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
              <span>{summaryReactionMeta?.emoji ?? "👍"}</span>
              <span>{reactionCount}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 pl-2 text-xs font-medium text-muted-foreground">
          <span suppressHydrationWarning>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>

          <button
            type="button"
            onClick={async () => {
              await onToggleCommentReaction(comment.id, reactionToggleType);
            }}
            className={cn(
              "transition-colors hover:text-foreground",
              currentReaction ? "text-primary" : "text-muted-foreground",
            )}
          >
            {reactionButtonLabel}
          </button>

          {depth < maxCommentReplyDepth ? (
            <button
              type="button"
              onClick={() => setReplyOpen((current) => !current)}
              className="transition-colors hover:text-foreground"
            >
              {replyOpen ? "Hide reply" : "Reply"}
            </button>
          ) : null}
        </div>

        {replyOpen ? (
          <div className="rounded-[1.2rem] border border-border/70 bg-white/3 p-3">
            <CommentForm
              postId={comment.postId}
              parentId={comment.id}
              variant="reply"
              submitLabel="Reply"
              onCommentOptimistic={onCommentOptimistic}
              onCommentConfirmed={onCommentConfirmed}
              onCommentRejected={onCommentRejected}
              onPostActivity={onPostActivity}
            />
          </div>
        ) : null}

        {replies.length ? (
          <div className="pl-1">
            <button
              type="button"
              onClick={() => setRepliesOpen((current) => !current)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <CornerDownRight className="h-4 w-4" />
              {repliesOpen
                ? "Hide replies"
                : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
              {repliesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {repliesOpen ? (
              <div className="mt-4 space-y-4 border-l border-border/70 pl-4">
                <CommentThread
                  comments={replies}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  onCommentOptimistic={onCommentOptimistic}
                  onCommentConfirmed={onCommentConfirmed}
                  onCommentRejected={onCommentRejected}
                  onToggleCommentReaction={onToggleCommentReaction}
                  onPostActivity={onPostActivity}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CommentThread({
  comments,
  currentUserId,
  depth = 0,
  onCommentOptimistic,
  onCommentConfirmed,
  onCommentRejected,
  onToggleCommentReaction,
  onPostActivity,
}: CommentThreadProps) {
  if (!comments.length) {
    return null;
  }

  return (
    <div className="space-y-5">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          depth={depth}
          onCommentOptimistic={onCommentOptimistic}
          onCommentConfirmed={onCommentConfirmed}
          onCommentRejected={onCommentRejected}
          onToggleCommentReaction={onToggleCommentReaction}
          onPostActivity={onPostActivity}
        />
      ))}
    </div>
  );
}
