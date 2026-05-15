"use client";

import { useEffect, useRef, useState } from "react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Copy, Lock, MessageCircle, MoreHorizontal, Plus, Share2 } from "lucide-react";
import { toast } from "sonner";
import { toggleReactionAction, votePollAction } from "@/actions/feed";
import { CommentForm, type PendingCommentInput } from "@/components/feed/comment-form";
import { PostImageGallery } from "@/components/feed/post-image-gallery";
import { CommentThread, type CommentTreeNode } from "@/components/feed/comment-thread";
import { useTheme } from "@/components/providers/theme-provider";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { reactionOptions } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";

type FeedReaction = {
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
};

export type FeedPost = {
  id: string;
  slug: string;
  category: string;
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
  reactions: FeedReaction[];
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

type ReactionOption = (typeof reactionOptions)[number];
type ReactionChoice = {
  value: string;
  emoji: string;
  label: string;
  isPreset: boolean;
};
type GroupedReaction = ReactionChoice & { count: number };

const presetReactionMap = new Map<string, ReactionOption>(reactionOptions.map((reaction) => [reaction.value, reaction]));
const reactionPickerVisibleCount = 5;
const postActionStripClassName = "grid grid-cols-3 gap-0.5 rounded-[1.15rem] bg-muted/35 p-0.5";
const postActionButtonClassName =
  "h-10 w-full justify-center rounded-[0.95rem] border-0 bg-transparent px-2.5 text-muted-foreground shadow-none transition-colors duration-150 hover:bg-background/80 hover:text-foreground";
const detailActionStripClassName = "grid grid-cols-3 gap-2";
const detailActionButtonClassName =
  "h-10 w-full justify-center rounded-full border border-border/60 bg-transparent px-3 text-muted-foreground shadow-none transition-colors duration-150 hover:bg-background/80 hover:text-foreground";

function getReactionChoice(reactionType: string): ReactionChoice {
  const presetReaction = presetReactionMap.get(reactionType);

  if (presetReaction) {
    return {
      ...presetReaction,
      isPreset: true,
    };
  }

  return {
    value: reactionType,
    emoji: reactionType,
    label: reactionType,
    isPreset: false,
  };
}

function getGroupedReactions(reactions: FeedPost["reactions"]): GroupedReaction[] {
  const reactionCounts = new Map<string, number>();

  for (const reaction of reactions) {
    reactionCounts.set(reaction.type, (reactionCounts.get(reaction.type) ?? 0) + 1);
  }

  const customReactionTypes = Array.from(reactionCounts.keys())
    .filter((reactionType) => !presetReactionMap.has(reactionType))
    .sort((left, right) => {
      const countDifference = (reactionCounts.get(right) ?? 0) - (reactionCounts.get(left) ?? 0);
      return countDifference || left.localeCompare(right);
    });

  return [...reactionOptions.map((reaction) => reaction.value), ...customReactionTypes].map((reactionType) => ({
    ...getReactionChoice(reactionType),
    count: reactionCounts.get(reactionType) ?? 0,
  }));
}

function getCurrentUserReaction(reactions: FeedPost["reactions"], userId: string): ReactionChoice | null {
  const currentReaction = [...reactions].reverse().find((reaction) => reaction.userId === userId);
  return currentReaction ? getReactionChoice(currentReaction.type) : null;
}

function getVisiblePickerReactions(
  groupedReactions: GroupedReaction[],
  currentUserReaction: ReactionChoice | null,
): GroupedReaction[] {
  const defaultReactions = groupedReactions.filter((reaction) => reaction.isPreset).slice(0, reactionPickerVisibleCount);

  if (!currentUserReaction) {
    return defaultReactions;
  }

  const selectedReaction = groupedReactions.find((reaction) => reaction.value === currentUserReaction.value) ?? {
    ...currentUserReaction,
    count: 0,
  };

  if (defaultReactions.some((reaction) => reaction.value === selectedReaction.value)) {
    return defaultReactions;
  }

  return [...defaultReactions.slice(0, reactionPickerVisibleCount - 1), selectedReaction];
}

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
  const existingReaction = reactions.find((reaction) => reaction.userId === userId);

  if (existingReaction?.type === reactionType) {
    return reactions.filter((reaction) => reaction.id !== existingReaction.id);
  }

  if (existingReaction) {
    return reactions.map((reaction) =>
      reaction.id === existingReaction.id
        ? {
            ...reaction,
            type: reactionType,
            createdAt: new Date(),
          }
        : reaction,
    );
  }

  return [
    ...reactions,
    {
      id: `optimistic-${scopeId}-${userId}`,
      type: reactionType,
      userId,
      createdAt: new Date(),
      user: {
        publicProfile: null,
      },
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
  currentUserReaction,
  onSelectReaction,
  buttonClassName,
}: {
  groupedReactions: GroupedReaction[];
  currentUserReaction: ReactionChoice | null;
  onSelectReaction: (reactionType: string) => Promise<void>;
  buttonClassName?: string;
}) {
  const { theme } = useTheme();
  const [trayOpen, setTrayOpen] = useState(false);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openTray(manual = false) {
    clearCloseTimer();
    setTrayOpen(true);

    if (manual) {
      setManualOpen(true);
    }
  }

  function closePicker() {
    clearCloseTimer();
    setTrayOpen(false);
    setCustomPickerOpen(false);
    setManualOpen(false);
  }

  function scheduleClose() {
    if (manualOpen || customPickerOpen) {
      return;
    }

    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setTrayOpen(false);
    }, 160);
  }

  useEffect(() => clearCloseTimer, []);

  const hasSelectedReaction = Boolean(currentUserReaction);
  const pickerVisible = trayOpen || customPickerOpen;
  const visiblePickerReactions = getVisiblePickerReactions(groupedReactions, currentUserReaction);
  const topReactionGroups = [...groupedReactions]
    .filter((reaction) => reaction.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);
  const buttonEmoji = currentUserReaction?.emoji ?? "👍";
  const buttonLabel = currentUserReaction
    ? currentUserReaction.isPreset
      ? currentUserReaction.label
      : "Reacted"
    : "Like";

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => openTray()}
      onMouseLeave={scheduleClose}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;

        if (nextTarget instanceof Node && containerRef.current?.contains(nextTarget)) {
          return;
        }

        if (!customPickerOpen) {
          closePicker();
        }
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape") {
          closePicker();
        }
      }}
    >
      <div
        className={cn(
          "absolute bottom-full left-0 z-20 mb-3 w-max max-w-[calc(100vw-3rem)] transition-all duration-200 ease-out",
          pickerVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <div className="flex flex-col gap-3" onMouseEnter={clearCloseTimer} onMouseLeave={scheduleClose}>
          <div className="grid grid-cols-6 gap-2 rounded-[1.7rem] border border-border/80 bg-background/95 px-2.5 py-2.5 shadow-[0_18px_45px_-25px_rgba(0,0,0,0.6)] backdrop-blur">
            {visiblePickerReactions.map((reaction, index) => {
              const hasReacted = currentUserReaction?.value === reaction.value;
              const tooltipLabel = reaction.isPreset ? reaction.label : `React with ${reaction.emoji}`;

              return (
                <div
                  key={reaction.value}
                  className={cn(
                    "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    pickerVisible
                      ? "translate-y-0 rotate-0 scale-100 opacity-100"
                      : index % 2 === 0
                        ? "translate-y-3 -rotate-12 scale-75 opacity-0"
                        : "translate-y-3 rotate-12 scale-75 opacity-0",
                  )}
                  style={{ transitionDelay: pickerVisible ? `${index * 18}ms` : undefined }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      void onSelectReaction(reaction.value);
                      closePicker();
                    }}
                    onFocus={() => openTray()}
                    className={cn(
                      "group relative flex h-10 w-10 items-center justify-center rounded-full text-2xl transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      "hover:-translate-y-1 hover:scale-[1.12] focus-visible:-translate-y-1 focus-visible:scale-[1.12]",
                      hasReacted ? "bg-primary/10 text-primary" : "hover:bg-white/6",
                    )}
                    aria-label={tooltipLabel}
                    title={tooltipLabel}
                  >
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 shadow-sm transition-all duration-150 group-hover:-translate-y-1 group-hover:opacity-100 group-focus-visible:-translate-y-1 group-focus-visible:opacity-100">
                      {tooltipLabel}
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
                </div>
              );
            })}

            <div
              className={cn(
                "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                pickerVisible ? "translate-y-0 rotate-0 scale-100 opacity-100" : "translate-y-3 rotate-12 scale-75 opacity-0",
              )}
              style={{ transitionDelay: pickerVisible ? `${visiblePickerReactions.length * 28}ms` : undefined }}
            >
              <button
                type="button"
                onClick={() => {
                  clearCloseTimer();
                  setTrayOpen(false);
                  setManualOpen(false);
                  setCustomPickerOpen(true);
                }}
                onFocus={() => openTray(true)}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border/80 text-muted-foreground transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  customPickerOpen
                    ? "bg-primary/10 text-primary"
                    : "hover:-translate-y-1 hover:scale-[1.12] hover:bg-white/6 hover:text-foreground",
                )}
                aria-label="Choose any emoji"
                title="Choose any emoji"
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2 py-1 text-[10px] font-medium text-background opacity-0 shadow-sm transition-all duration-150 group-hover:-translate-y-1 group-hover:opacity-100 group-focus-visible:-translate-y-1 group-focus-visible:opacity-100">
                  Choose any emoji
                </span>
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-11 rounded-[1.05rem] border-0 bg-transparent px-3 text-muted-foreground shadow-none transition-colors duration-150",
          hasSelectedReaction
            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            : "hover:bg-background/80 hover:text-foreground",
          buttonClassName,
        )}
        onClick={() => {
          if (pickerVisible && manualOpen) {
            closePicker();
            return;
          }

          openTray(true);
        }}
        aria-expanded={pickerVisible}
      >
        {topReactionGroups.length ? (
          <span className="flex shrink-0 -space-x-2">
            {topReactionGroups.map((reaction) => (
              <span
                key={reaction.value}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-background bg-secondary text-xs shadow-sm"
              >
                {reaction.emoji}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-base leading-none">{buttonEmoji}</span>
        )}
        <span>{buttonLabel}</span>
      </Button>

      <Dialog open={customPickerOpen} onOpenChange={setCustomPickerOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>Choose reaction</DialogTitle>
            <DialogDescription>Pick any emoji outside the default reaction row.</DialogDescription>
          </DialogHeader>

          <EmojiPicker
            width="100%"
            height={420}
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
            searchPlaceholder="Search emoji"
            skinTonesDisabled
            theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(emojiData: EmojiClickData) => {
              void onSelectReaction(emojiData.emoji);
              setCustomPickerOpen(false);
              closePicker();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReactionDetailsDialog({
  open,
  onOpenChange,
  reactions,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reactions: FeedPost["reactions"];
  currentUserId: string;
}) {
  const reactionSections = getGroupedReactions(reactions)
    .filter((reaction) => reaction.count > 0)
    .sort((left, right) => right.count - left.count)
    .map((reaction) => ({
      ...reaction,
      actors: reactions
        .filter((entry) => entry.type === reaction.value)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle>Reaction details</DialogTitle>
          <DialogDescription>See who reacted and which reaction they used on this post.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {reactionSections.map((reaction) => (
              <Badge key={reaction.value} variant="muted" className="px-3 py-1.5 text-[0.72rem] tracking-[0.12em]">
                {reaction.emoji} {reaction.count}
              </Badge>
            ))}
          </div>

          {reactionSections.map((reaction) => (
            <div key={reaction.value} className="space-y-3 rounded-[1.35rem] border border-border/70 bg-white/4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{reaction.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{reaction.label}</p>
                    <p className="text-xs text-muted-foreground">{reaction.count} people used this reaction</p>
                  </div>
                </div>
                <Badge variant="muted">{reaction.count}</Badge>
              </div>

              <div className="space-y-3">
                {reaction.actors.map((actor) => {
                  const displayName = actor.userId === currentUserId
                    ? "You"
                    : actor.user.publicProfile?.username ?? "Shadow user";

                  return (
                    <div key={actor.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5">
                      <Avatar className="h-9 w-9 border border-border/70">
                        <AvatarImage src={actor.user.publicProfile?.avatarUrl ?? undefined} alt={displayName} />
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">Reacted with {reaction.emoji}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
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
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const commentPanelRef = useRef<HTMLDivElement>(null);

  const resolvedDetailsOpen = detailsOpen ?? internalDetailsOpen;
  const displayName = postState.isAnonymous
    ? "Anonymous Echo"
    : postState.author.publicProfile?.username ?? "Shadow user";
  const groupedReactions = getGroupedReactions(postState.reactions);
  const currentUserReaction = getCurrentUserReaction(postState.reactions, currentUserId);
  const totalReactionCount = postState.reactions.length;
  const visibleReactionGroups = [...groupedReactions]
    .filter((reaction) => reaction.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);
  const currentVote = postState.poll?.votes.find((vote) => vote.userId === currentUserId)?.optionId;
  const totalVotes = postState.poll?.votes.length ?? 0;
  const commentCount = countComments(postState.comments);
  const postImages = getRenderablePostImages(postState);
  const hasMedia = Boolean(postState.gifUrl || postImages.length);
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

  function jumpToComments() {
    commentPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  async function handleCommentReaction(commentId: string, reactionType: string) {
    let previousPost = postState;

    setPostState((currentPost) => {
      previousPost = currentPost;

      return {
        ...currentPost,
        comments: toggleCommentReaction(currentPost.comments, commentId, currentUserId, reactionType),
      };
    });
    onPostActivity?.(postState.id);

    const formData = new FormData();
    formData.set("commentId", commentId);
    formData.set("reactionType", reactionType);

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
        title: `${displayName} on ShadowFeed`,
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Avatar className="h-10 w-10">
            <AvatarImage src={postState.author.publicProfile?.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="truncate font-semibold text-foreground">{displayName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span suppressHydrationWarning>{formatDistanceToNow(new Date(postState.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!postState.allowComments ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/4 px-3 py-1 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Comments locked
            </div>
          ) : null}

          <button
            type="button"
            aria-label="Post options"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  function renderPollSection(compact = false) {
    if (!postState.poll) {
      return null;
    }

    return (
      <div className={cn("space-y-4", compact ? "" : "px-5 pb-5 pt-4")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Poll</p>
            <h3 className="mt-2 text-lg font-medium text-foreground">{postState.poll.question}</h3>
          </div>
          <p className="pt-0.5 text-sm text-muted-foreground">{totalVotes} votes</p>
        </div>

        <div className="space-y-2.5">
          {postState.poll.options.map((option) => {
            const count = option.votes.length;
            const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
            const isSelected = currentVote === option.id;

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
                className="space-y-0"
              >
                <input type="hidden" name="pollId" value={postState.poll!.id} />
                <input type="hidden" name="optionId" value={option.id} />
                <button
                  className={cn(
                    "w-full rounded-2xl border border-border/70 bg-white/3 px-4 py-3 text-left transition-colors",
                    isSelected ? "border-primary/30 bg-primary/8" : "hover:bg-white/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-foreground">{option.label}</span>
                    <span className={cn("font-mono text-xs", isSelected ? "text-primary" : "text-muted-foreground")}>
                      {isSelected ? "voted" : `${percent}%`}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/8">
                    <div
                      className={cn("h-1.5 rounded-full transition-[width] duration-300", percent ? "bg-primary/80" : "bg-white/20")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      </div>
    );
  }

  function renderPostNarrative(className?: string) {
    if (!postState.content.trim()) {
      return null;
    }

    return (
      <div className={cn("space-y-3", className)}>
        <div className="space-y-2 text-[0.95rem] leading-6 text-foreground">
          <MarkdownRenderer content={postState.content} />
        </div>
      </div>
    );
  }

  function renderInlinePostMedia() {
    return (
      <>
        {postState.gifUrl ? (
          <div className="overflow-hidden border-y border-border/70 bg-black">
            <Image
              src={postState.gifUrl}
              alt="Post GIF"
              width={1200}
              height={900}
              unoptimized
              className="max-h-152 w-full object-cover md:max-h-168"
            />
          </div>
        ) : null}

        {postImages.length ? (
          <div className="overflow-hidden border-b border-border/70">
            <PostImageGallery
              images={postImages}
              title={`${displayName} post images`}
              className="max-h-168"
            />
          </div>
        ) : null}
      </>
    );
  }

  function renderDetailMediaCard() {
    if (postState.gifUrl) {
      return (
        <div className="flex h-full min-h-88 w-full items-center justify-center overflow-hidden rounded-4xl border border-white/10 bg-black/80 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.85)]">
          <Image
            src={postState.gifUrl}
            alt="Post GIF"
            width={1600}
            height={1200}
            unoptimized
            loading="eager"
            className="h-auto w-auto max-w-full object-contain"
            style={{ width: "auto", height: "auto", maxHeight: "calc(92vh - 5rem)" }}
          />
        </div>
      );
    }

    if (postImages.length === 1) {
      const image = postImages[0];

      return (
        <div className="flex h-full min-h-88 w-full items-center justify-center overflow-hidden rounded-4xl border border-white/10 bg-black/80 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.85)]">
          <Image
            src={image.imageUrl}
            alt={`${displayName} post image`}
            width={Math.max(image.width, 1)}
            height={Math.max(image.height, 1)}
            unoptimized
            loading="eager"
            sizes="(min-width: 1280px) 60vw, 100vw"
            className="h-auto w-auto max-w-full object-contain"
            style={{ width: "auto", height: "auto", maxHeight: "calc(92vh - 5rem)" }}
          />
        </div>
      );
    }

    if (!postImages.length) {
      return null;
    }

    return (
      <div className="w-full overflow-hidden rounded-4xl border border-white/10 bg-black/80 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.85)]">
        <PostImageGallery
          images={postImages}
          title={`${displayName} post images`}
          className="max-h-[calc(92vh-5rem)]"
        />
      </div>
    );
  }

  function renderDetailActivityPanel() {
    return (
      <div className="space-y-4 border-t border-border/60 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              if (totalReactionCount) {
                setReactionsOpen(true);
              }
            }}
            className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
          >
            {visibleReactionGroups.length ? (
              <span className="flex -space-x-2">
                {visibleReactionGroups.map((reaction) => (
                  <span
                    key={reaction.value}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-background bg-secondary text-xs shadow-sm"
                  >
                    {reaction.emoji}
                  </span>
                ))}
              </span>
            ) : null}

            <span>{totalReactionCount ? `${totalReactionCount} reactions` : "Be the first to react to this post."}</span>
          </button>

          <button type="button" onClick={jumpToComments} className="transition-colors hover:text-foreground">
            {commentCount ? `${commentCount} comments` : "Start the first comment"}
          </button>
        </div>

        <div className={detailActionStripClassName}>
          <ReactionPicker
            groupedReactions={groupedReactions}
            currentUserReaction={currentUserReaction}
            onSelectReaction={handlePostReaction}
            buttonClassName={detailActionButtonClassName}
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={detailActionButtonClassName}
            onClick={jumpToComments}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={detailActionButtonClassName}
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>
    );
  }

  function renderPostBody() {
    const narrative = renderPostNarrative();

    return (
      <>
        {narrative ? <CardContent className="mt-2 px-4 pb-3 pt-0">{narrative}</CardContent> : null}

        {renderInlinePostMedia()}

        {renderPollSection()}
      </>
    );
  }

  function renderCommentPanel() {
    return (
      <div ref={commentPanelRef} className="space-y-4 border-t border-border/60 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Discussion</p>
            <p className="mt-1 text-sm text-muted-foreground">Most relevant replies first</p>
          </div>
          <p className="text-muted-foreground">
            {commentCount ? `${commentCount} ${commentCount === 1 ? "answer" : "answers"}` : "No answers yet"}
          </p>
        </div>

        <div className="space-y-4">
          <CommentThread
            comments={postState.comments}
            currentUserId={currentUserId}
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
      </div>
    );
  }

  return (
    <>
      <article className="theme-card-shadow mb-5 overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/95 last:mb-0">
        <CardHeader className="gap-0 px-4 pb-0.5 pt-3.5">{renderHeaderContent()}</CardHeader>

        {renderPostBody()}

        <div className="border-t border-border/70 px-3 pb-3 pt-2">
          <div className={postActionStripClassName}>
            <ReactionPicker
              groupedReactions={groupedReactions}
              currentUserReaction={currentUserReaction}
              onSelectReaction={handlePostReaction}
              buttonClassName={postActionButtonClassName}
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={postActionButtonClassName}
              onClick={() => setDetailsOpen(true)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={postActionButtonClassName}
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </article>

      <ReactionDetailsDialog
        open={reactionsOpen}
        onOpenChange={setReactionsOpen}
        reactions={postState.reactions}
        currentUserId={currentUserId}
      />

      <Dialog open={resolvedDetailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className={cn("max-h-[94vh] overflow-hidden border border-border/70 bg-card/98 p-0 backdrop-blur-xl", hasMedia ? "max-w-7xl" : "max-w-4xl")}>
          <DialogHeader className="sr-only">
            <DialogTitle>Post details</DialogTitle>
            <DialogDescription>
              Full post thread with reactions, comments, and share-ready context.
            </DialogDescription>
          </DialogHeader>

          <div className={cn("grid max-h-[94vh] min-h-136", hasMedia && "lg:grid-cols-[minmax(0,1.3fr)_430px]")}>
            {hasMedia ? (
              <div className="relative hidden min-h-0 overflow-hidden border-r border-white/10 bg-[#08090d] lg:flex">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,187,92,0.18),transparent_36%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative flex w-full items-center justify-center p-6">{renderDetailMediaCard()}</div>
              </div>
            ) : null}

            <div className="flex min-h-0 flex-col bg-card/98">
              <div className="px-6 pb-4 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-primary/80">
                  <span>Open thread</span>
                  <button type="button" onClick={() => setShareOpen(true)} className="transition-colors hover:text-primary">
                    Share link
                  </button>
                </div>
                {renderHeaderContent()}
              </div>

              {hasMedia ? <div className="px-6 py-6 lg:hidden">{renderDetailMediaCard()}</div> : null}

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-5 px-6 py-5">
                  {postState.content.trim() ? <div className="px-1">{renderPostNarrative()}</div> : null}

                  {postState.poll ? (
                    <div className="border-t border-border/60 pt-4">
                      {renderPollSection(true)}
                    </div>
                  ) : null}

                  {renderDetailActivityPanel()}
                </div>

                {renderCommentPanel()}
              </div>
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
