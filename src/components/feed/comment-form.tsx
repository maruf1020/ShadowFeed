"use client";

import { useRef, useState } from "react";
import { Film } from "lucide-react";
import { toast } from "sonner";
import { createCommentAction } from "@/actions/feed";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type PendingCommentInput = {
  tempId: string;
  content: string;
  gifUrl: string | null;
  parentId?: string;
};

type CommentFormProps = {
  postId: string;
  parentId?: string;
  onCommentOptimistic?: (comment: PendingCommentInput) => void;
  onCommentConfirmed?: (tempId: string, commentId: string) => void;
  onCommentRejected?: (tempId: string) => void;
  onPostActivity?: () => void;
  variant?: "detail" | "reply";
  submitLabel?: string;
};

export function CommentForm({
  postId,
  parentId,
  onCommentOptimistic,
  onCommentConfirmed,
  onCommentRejected,
  onPostActivity,
  variant = "detail",
  submitLabel,
}: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showGifField, setShowGifField] = useState(false);
  const isReply = variant === "reply";
  const resolvedSubmitLabel = submitLabel ?? (parentId ? "Reply" : "Answer");

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const content = String(formData.get("content") ?? "").trim();
        const gifUrlValue = String(formData.get("gifUrl") ?? "").trim();

        if (!content) {
          return;
        }

        const tempId = `temp-${crypto.randomUUID()}`;
        onCommentOptimistic?.({
          tempId,
          content,
          gifUrl: gifUrlValue || null,
          parentId,
        });
        onPostActivity?.();

        try {
          const result = await createCommentAction(formData);

          if (result?.ok && result.commentId) {
            onCommentConfirmed?.(tempId, result.commentId);
            formRef.current?.reset();
            setShowGifField(false);
            return;
          }

          onCommentRejected?.(tempId);
          toast.error("Could not publish that comment.");
        } catch {
          onCommentRejected?.(tempId);
          toast.error("Could not publish that comment.");
        }
      }}
      className={cn(
        "space-y-3",
        isReply
          ? "rounded-[1.1rem] border border-border/60 bg-transparent p-0"
          : "rounded-[1.3rem] border border-border/70 bg-white/4 p-4",
      )}
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}

      <div className={cn("rounded-[1.2rem] border border-border/70 bg-background px-4 py-3", isReply && "bg-white/4")}>
        <Textarea
          name="content"
          placeholder={parentId ? "Write a reply..." : "Answer this post..."}
          className="min-h-12 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </div>

      {showGifField ? <Input name="gifUrl" placeholder="Optional GIF URL" /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowGifField((current) => !current)}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Film className="h-3.5 w-3.5" />
          {showGifField ? "Hide GIF field" : "Add GIF"}
        </button>

        <SubmitButton variant="secondary" className="w-full sm:w-auto" pendingLabel="Sending...">
          {resolvedSubmitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
