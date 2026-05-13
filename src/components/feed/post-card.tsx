"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Copy, Lock, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { toggleReactionAction, votePollAction } from "@/actions/feed";
import { CommentForm, type PendingCommentInput } from "@/components/feed/comment-form";
import { PostImageGallery } from "@/components/feed/post-image-gallery";
import { CommentThread, type CommentTreeNode } from "@/components/feed/comment-thread";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { reactionOptions } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";

export type FeedPost = {
  id: string;
  slug: string;
  category: string;
  title: string | null;
  content: string;
  gifUrl: string | null;
  imageUrl: string | null;
  images: Array<{
    id: string;
    imageUrl: string;
    width: number;
    height: number;
    displayOrder: number;
  }>;
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

type GroupedReaction = (typeof reactionOptions)[number] & { count: number };
type PostInterestChoice = "interested" | "not-interested";

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

function getRenderablePostImages(post: FeedPost) {
  if (post.images.length) {
    return post.images;
  }

  if (!post.imageUrl) {
    return [];
  }

  return [
    {
      id: `legacy-${post.id}`,
      imageUrl: post.imageUrl,
      width: 1200,
      height: 900,
      displayOrder: 0,
    },
  ];
}

function ReactionPicker({
  groupedReactions,
  currentUserReactions,
  onSelectReaction,
}: {
  groupedReactions: GroupedReaction[];
  currentUserReactions: Array<(typeof reactionOptions)[number]>;
  onSelectReaction: (reactionType: string) => Promise<void>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewReaction, setPreviewReaction] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
        setPreviewReaction(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPickerOpen(false);
        setPreviewReaction(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pickerOpen]);

  const previewOption = groupedReactions.find((reaction) => reaction.value === previewReaction);
  const selectedReaction = currentUserReactions[0];
  const totalReactions = groupedReactions.reduce((total, reaction) => total + reaction.count, 0);
  const buttonEmoji = previewOption?.emoji ?? selectedReaction?.emoji ?? "✨";
  const buttonLabel = previewOption?.label ?? selectedReaction?.label ?? "Reaction";

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setPickerOpen(true)}
      onMouseLeave={() => {
        setPickerOpen(false);
        setPreviewReaction(null);
      }}
    >
      <div
        className={cn(
          "absolute bottom-full left-0 z-20 mb-3 w-max max-w-[calc(100vw-3rem)] transition-all duration-200 ease-out",
          pickerOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-border/80 bg-background/95 px-2 py-2 shadow-[0_18px_45px_-25px_rgba(0,0,0,0.6)] backdrop-blur">
          {groupedReactions.map((reaction, index) => {
            const hasReacted = currentUserReactions.some((item) => item.value === reaction.value);

            return (
              <button
                key={reaction.value}
                type="button"
                onClick={() => {
                  void onSelectReaction(reaction.value);
                  setPickerOpen(false);
                  setPreviewReaction(null);
                }}
                onMouseEnter={() => setPreviewReaction(reaction.value)}
                onFocus={() => {
                  setPickerOpen(true);
                  setPreviewReaction(reaction.value);
                }}
                className={cn(
                  "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  "hover:-translate-y-3 hover:scale-[1.18] focus-visible:-translate-y-3 focus-visible:scale-[1.18]",
                  hasReacted ? "bg-primary/10" : "hover:bg-white/6",
                )}
                style={{ transitionDelay: pickerOpen ? `${index * 18}ms` : undefined }}
                aria-label={reaction.label}
                title={reaction.label}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 shadow-sm transition-all duration-150 group-hover:-translate-y-1 group-hover:opacity-100 group-focus-visible:-translate-y-1 group-focus-visible:opacity-100">
                  {reaction.label}
                </span>
                <span aria-hidden className="leading-none">
                  {reaction.emoji}
                </span>
                {reaction.count ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                    {reaction.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        type="button"
        variant={currentUserReactions.length ? "secondary" : "ghost"}
        size="sm"
        className="h-10 rounded-full px-4"
        onClick={() => setPickerOpen((current) => !current)}
        aria-expanded={pickerOpen}
      >
        <span className="text-base leading-none">{buttonEmoji}</span>
        <span>{buttonLabel}</span>
        {totalReactions ? (
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {totalReactions}
          </span>
        ) : null}
      </Button>
    </div>
  );
}

export function PostCard({
  post,
  currentUserId,
  onPostActivity,
  detailsOpen,
  onDetailsOpenChange,
}: {
  post: FeedPost;
  currentUserId: string;
  onPostActivity?: (postId: string) => void;
  detailsOpen?: boolean;
  onDetailsOpenChange?: (open: boolean) => void;
}) {
  const [postState, setPostState] = useState<FeedPost>(() => ({
    ...post,
    comments: getRootComments(post.comments),
  }));
  const [internalDetailsOpen, setInternalDetailsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [interestChoice, setInterestChoice] = useState<PostInterestChoice | null>(null);

  const resolvedDetailsOpen = detailsOpen ?? internalDetailsOpen;
  const displayName = postState.isAnonymous
    ? "Anonymous Echo"
    : postState.author.publicProfile?.username ?? "Shadow user";
  const categoryLabel = postState.category.replaceAll("_", " ");
  const profileDetail = postState.isAnonymous
    ? "Identity hidden"
    : postState.author.publicProfile?.fakeEmail ?? "Visible thread";
  const groupedReactions = reactionOptions.map((reaction) => ({
    ...reaction,
    count: postState.reactions.filter((item) => item.type === reaction.value).length,
  }));
  const currentUserReactions = reactionOptions.filter((reaction) =>
    postState.reactions.some((item) => item.userId === currentUserId && item.type === reaction.value),
  );
  const activeReactionSummary = groupedReactions
    .filter((reaction) => reaction.count > 0)
    .map((reaction) => `${reaction.emoji} ${reaction.count}`)
    .join(" · ");
  const currentVote = postState.poll?.votes.find((vote) => vote.userId === currentUserId)?.optionId;
  const totalVotes = postState.poll?.votes.length ?? 0;
  const commentCount = countComments(postState.comments);
  const postImages = getRenderablePostImages(postState);
  const shareUrl =
    typeof window === "undefined"
      ? `/feed?post=${postState.slug}`
      : new URL(`/feed?post=${postState.slug}`, window.location.origin).toString();

  function setDetailsOpen(nextOpen: boolean) {
    onDetailsOpenChange?.(nextOpen);

    if (detailsOpen === undefined) {
      setInternalDetailsOpen(nextOpen);
    }
  }

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

  async function handlePostReaction(reactionType: string) {
    let previousPost = postState;

    setPostState((currentPost) => {
      previousPost = currentPost;

      return {
        ...currentPost,
        reactions: toggleReactionList(currentPost.reactions, currentUserId, reactionType, currentPost.id),
      };
    });
    onPostActivity?.(postState.id);

    const formData = new FormData();
    formData.set("postId", postState.id);
    formData.set("reactionType", reactionType);

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
  }

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Post link copied.");
    } catch {
      toast.error("Could not copy the post link.");
    }
  }

  async function handleNativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      await handleCopyShareLink();
      setShareOpen(false);
      return;
    }

    try {
      await navigator.share({
        title: postState.title ?? `${displayName} on ShadowFeed`,
        text: postState.content.slice(0, 120),
        url: shareUrl,
      });
      setShareOpen(false);
    } catch {
      // User cancel is fine here.
    }
  }

  function renderHeaderContent() {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={postState.author.publicProfile?.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="truncate font-semibold text-foreground">{displayName}</span>
              {postState.isAnonymous ? <Badge variant="muted">Anonymous</Badge> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{profileDetail}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(postState.createdAt), { addSuffix: true })}</span>
              <span>•</span>
              <span className="capitalize">{categoryLabel.toLowerCase()}</span>
            </div>
          </div>
        </div>

        {!postState.allowComments ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/4 px-3 py-1 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-primary" />
            Comments locked
          </div>
        ) : null}
      </div>
    );
  }

  function renderPollSection() {
    if (!postState.poll) {
      return null;
    }

    return (
      <div className="px-0 pb-5 pt-5">
        <div className="rounded-[1.5rem] border border-primary/20 bg-primary/7 p-4">
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
                  <button className="w-full rounded-[1.35rem] border border-border/70 bg-white/4 px-4 py-3 text-left transition-colors hover:bg-white/6">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-secondary-foreground">{option.label}</span>
                      <span className="font-mono text-primary">
                        {currentVote === option.id ? "voted" : `${percent}%`}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderInterestPrompt() {
    return (
      <div className="px-0 pb-5 pt-4">
        <div className="rounded-[1.25rem] border border-border/70 bg-white/4 p-4">
          <p className="text-sm font-medium text-foreground">Are you interested in this post?</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              aria-pressed={interestChoice === "interested"}
              onClick={() => setInterestChoice("interested")}
              className={cn(
                "h-10 rounded-xl border-border/70 bg-background/60 text-sm text-foreground hover:bg-white/6",
                interestChoice === "interested" && "border-primary/50 bg-primary/10 text-primary",
              )}
            >
              Interested
            </Button>

            <Button
              type="button"
              variant="outline"
              aria-pressed={interestChoice === "not-interested"}
              onClick={() => setInterestChoice("not-interested")}
              className={cn(
                "h-10 rounded-xl border-border/70 bg-background/60 text-sm text-foreground hover:bg-white/6",
                interestChoice === "not-interested" && "border-primary/50 bg-primary/10 text-primary",
              )}
            >
              Not interested
            </Button>
          </div>

          {interestChoice ? <p className="mt-3 text-xs text-muted-foreground">Thanks for the feedback.</p> : null}
        </div>
      </div>
    );
  }

  function renderPostBody(showInterestPrompt = false) {
    return (
      <>
        <CardContent className="space-y-4 px-0 pb-5 pt-0">
          {postState.title ? <CardTitle className="text-lg font-semibold">{postState.title}</CardTitle> : null}

          <div className="space-y-3 text-[0.97rem] leading-7 text-foreground">
            <MarkdownRenderer content={postState.content} />
          </div>

          {postState.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {postState.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="muted">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>

        {postState.gifUrl ? (
          <div className="overflow-hidden border-y border-border/70">
            <Image
              src={postState.gifUrl}
              alt="Post GIF"
              width={1200}
              height={900}
              unoptimized
              className="max-h-[38rem] w-full object-cover"
            />
          </div>
        ) : null}

        {postImages.length ? (
          <div className="overflow-hidden border-b border-border/70">
            <PostImageGallery
              images={postImages}
              title={postState.title ?? `${displayName} post images`}
              className="max-h-[38rem]"
            />
          </div>
        ) : null}

        {renderPollSection()}

        {showInterestPrompt ? renderInterestPrompt() : null}
      </>
    );
  }

  function renderCommentPanel() {
    return (
      <div className="space-y-4 rounded-[1.6rem] border border-border/70 bg-white/4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="font-medium text-foreground">Post discussion</p>
          <p className="text-muted-foreground">
            {commentCount ? `${commentCount} ${commentCount === 1 ? "answer" : "answers"}` : "No answers yet"}
          </p>
        </div>

        {commentCount ? <p className="text-sm text-muted-foreground">Most relevant</p> : null}

        <CommentThread
          comments={postState.comments}
          onCommentOptimistic={handleOptimisticComment}
          onCommentConfirmed={handleCommentConfirmed}
          onCommentRejected={handleCommentRejected}
          onToggleCommentReaction={handleCommentReaction}
          onPostActivity={() => onPostActivity?.(postState.id)}
        />

        {postState.allowComments ? (
          <CommentForm
            postId={postState.id}
            variant="detail"
            submitLabel="Comment"
            onCommentOptimistic={handleOptimisticComment}
            onCommentConfirmed={handleCommentConfirmed}
            onCommentRejected={handleCommentRejected}
            onPostActivity={() => onPostActivity?.(postState.id)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Replies are disabled for this post.</p>
        )}
      </div>
    );
  }

  return (
    <>
      <article className="overflow-hidden border-b border-border/70 bg-transparent py-2 last:border-b-0">
        <CardHeader className="gap-0 px-0 py-4">{renderHeaderContent()}</CardHeader>

        {renderPostBody(true)}

        <div className="border-t border-border/70 px-0 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <ReactionPicker
              groupedReactions={groupedReactions}
              currentUserReactions={currentUserReactions}
              onSelectReaction={handlePostReaction}
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 rounded-full px-4"
              onClick={() => setDetailsOpen(true)}
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              <span>Comment</span>
              {commentCount ? <span className="text-xs text-muted-foreground">{commentCount}</span> : null}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 rounded-full px-4"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-4 w-4 text-primary" />
              <span>Share</span>
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              {activeReactionSummary || "Be the first to react to this post."}
            </p>
            <p className="text-muted-foreground">
              {commentCount ? `${commentCount} ${commentCount === 1 ? "comment" : "comments"}` : "No comments yet"}
            </p>
          </div>
        </div>
      </article>

      <Dialog open={resolvedDetailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl p-0">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Post details</DialogTitle>
            <DialogDescription>
              Full post thread with reactions, comments, and share-ready context.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(92vh-5.5rem)] overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              <div className="space-y-5 rounded-[1.6rem] border border-border/70 bg-white/4 p-5">
                {renderHeaderContent()}
                {renderPostBody()}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                  <ReactionPicker
                    groupedReactions={groupedReactions}
                    currentUserReactions={currentUserReactions}
                    onSelectReaction={handlePostReaction}
                  />

                  <Button type="button" variant="outline" onClick={() => setShareOpen(true)}>
                    <Share2 className="h-4 w-4" />
                    Share post
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {activeReactionSummary || "Be the first to react to this post."}
                </p>
              </div>

              {renderCommentPanel()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Share post</DialogTitle>
            <DialogDescription>
              Anyone opening this link lands on the feed with this post modal already open.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <Input value={shareUrl} readOnly />

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await handleCopyShareLink();
                  setShareOpen(false);
                }}
              >
                <Copy className="h-4 w-4" />
                Copy link
              </Button>

              <Button type="button" onClick={handleNativeShare}>
                <Share2 className="h-4 w-4" />
                Share now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
