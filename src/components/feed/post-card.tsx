import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { toggleReactionAction, votePollAction } from "@/actions/feed";
import { CommentForm } from "@/components/feed/comment-form";
import { CommentThread, type CommentTreeNode } from "@/components/feed/comment-thread";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reactionOptions } from "@/lib/constants";
import { getInitials } from "@/lib/utils";

type FeedPost = {
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

export function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId: string }) {
  const displayName = post.isAnonymous
    ? "Anonymous Echo"
    : post.author.publicProfile?.username ?? "Shadow user";
  const groupedReactions = reactionOptions.map((reaction) => ({
    ...reaction,
    count: post.reactions.filter((item) => item.type === reaction.value).length,
  }));
  const currentVote = post.poll?.votes.find((vote) => vote.userId === currentUserId)?.optionId;
  const totalVotes = post.poll?.votes.length ?? 0;

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="gap-5 border-b border-border/70 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={post.author.publicProfile?.avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-foreground">{displayName}</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{post.category.replaceAll("_", " ")}</Badge>
                {post.tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="muted">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-full border border-border/80 bg-white/4 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            {post.allowComments ? "comments on" : "comments locked"}
          </div>
        </div>

        {post.title ? <CardTitle className="text-2xl">{post.title}</CardTitle> : null}
      </CardHeader>

      <CardContent className="space-y-6 px-6 py-6">
        <MarkdownRenderer content={post.content} />

        {post.gifUrl ? (
          <Image
            src={post.gifUrl}
            alt="Post GIF"
            width={800}
            height={450}
            unoptimized
            className="max-h-96 rounded-[1.4rem] border border-border/70 object-cover"
          />
        ) : null}

        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt="Post attachment"
            width={800}
            height={450}
            unoptimized
            className="max-h-96 rounded-[1.4rem] border border-border/70 object-cover"
          />
        ) : null}

        {post.poll ? (
          <div className="rounded-[1.4rem] border border-primary/20 bg-primary/7 p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Poll</p>
                <h3 className="mt-2 text-lg font-medium text-foreground">{post.poll.question}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{totalVotes} votes</p>
            </div>

            <div className="space-y-3">
              {post.poll.options.map((option) => {
                const count = option.votes.length;
                const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

                return (
                  <form key={option.id} action={votePollAction} className="space-y-2">
                    <input type="hidden" name="pollId" value={post.poll!.id} />
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
            <form key={reaction.value} action={toggleReactionAction}>
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
              Comments ({post.comments.length})
            </h3>
            {!post.allowComments ? (
              <span className="text-sm text-muted-foreground">Author locked comments</span>
            ) : null}
          </div>

          {post.allowComments ? <CommentForm postId={post.id} /> : null}
          <CommentThread comments={post.comments.filter((comment) => !comment.parentId)} />
        </div>
      </CardContent>
    </Card>
  );
}
