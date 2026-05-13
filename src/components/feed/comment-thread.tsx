"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CommentForm, type PendingCommentInput } from "@/components/feed/comment-form";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { maxCommentReplyDepth } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";

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
  }>;
  replies?: CommentTreeNode[];
};

type CommentThreadProps = {
  comments: CommentTreeNode[];
  depth?: number;
  onCommentOptimistic: (comment: PendingCommentInput) => void;
  onCommentConfirmed: (tempId: string, commentId: string) => void;
  onCommentRejected: (tempId: string) => void;
  onToggleCommentReaction: (commentId: string, formData: FormData) => Promise<void>;
  onPostActivity: () => void;
};

function CommentItem({
  comment,
  depth,
  onCommentOptimistic,
  onCommentConfirmed,
  onCommentRejected,
  onToggleCommentReaction,
  onPostActivity,
}: {
  comment: CommentTreeNode;
  depth: number;
  onCommentOptimistic: (comment: PendingCommentInput) => void;
  onCommentConfirmed: (tempId: string, commentId: string) => void;
  onCommentRejected: (tempId: string) => void;
  onToggleCommentReaction: (commentId: string, formData: FormData) => Promise<void>;
  onPostActivity: () => void;
}) {
  const replies = comment.replies ?? [];
  const displayName = comment.isAnonymous ? "Anonymous Echo" : comment.author.publicProfile?.username ?? "Shadow user";
  const laughCount = comment.reactions.filter((reaction) => reaction.type === "LAUGH").length;
  const [replyOpen, setReplyOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);

  return (
    <div className={cn("flex gap-3", depth > 0 && "ml-4") }>
      <Avatar className="mt-1 h-9 w-9">
        <AvatarImage src={comment.author.publicProfile?.avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="rounded-[1.15rem] bg-white/4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-foreground">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          <div className="mt-1 text-sm leading-6 text-foreground">
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
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 pl-2 text-xs text-muted-foreground">
          <form
            action={async (formData) => {
              await onToggleCommentReaction(comment.id, formData);
            }}
          >
            <input type="hidden" name="commentId" value={comment.id} />
            <input type="hidden" name="reactionType" value="LAUGH" />
            <button type="submit" className="transition-colors hover:text-foreground">
              Like{laughCount ? ` ${laughCount}` : ""}
            </button>
          </form>

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
          <div className="mt-3">
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
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setRepliesOpen((current) => !current)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {repliesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {repliesOpen
                ? "Hide replies"
                : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
            </button>

            {repliesOpen ? (
              <div className="mt-3 border-l border-border/70 pl-4">
                <CommentThread
                  comments={replies}
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
