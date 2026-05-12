import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { toggleReactionAction } from "@/actions/feed";
import { CommentForm } from "@/components/feed/comment-form";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

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
  }>;
  replies: CommentTreeNode[];
};

export function CommentThread({ comments }: { comments: CommentTreeNode[] }) {
  if (!comments.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const displayName = comment.isAnonymous
          ? "Anonymous Echo"
          : comment.author.publicProfile?.username ?? "Shadow user";

        return (
          <div key={comment.id} className="rounded-[1.3rem] border border-border/70 bg-black/20 p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.author.publicProfile?.avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{displayName}</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <MarkdownRenderer content={comment.content} />

                {comment.gifUrl ? (
                  <Image
                    src={comment.gifUrl}
                    alt="Comment GIF"
                    width={640}
                    height={360}
                    unoptimized
                    className="max-h-64 rounded-2xl border border-border/70 object-cover"
                  />
                ) : null}

                <form action={toggleReactionAction}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="reactionType" value="LAUGH" />
                  <Button variant="ghost" size="sm">
                    React 😂
                  </Button>
                </form>

                <CommentForm postId={comment.postId} parentId={comment.id} />

                {comment.replies.length ? (
                  <div className="border-l border-border/70 pl-4">
                    <CommentThread comments={comment.replies} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
