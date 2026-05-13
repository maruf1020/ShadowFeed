"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { createCommentAction } from "@/actions/feed";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
};

export function CommentForm({
  postId,
  parentId,
  onCommentOptimistic,
  onCommentConfirmed,
  onCommentRejected,
  onPostActivity,
}: CommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

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
            return;
          }

          onCommentRejected?.(tempId);
          toast.error("Could not publish that comment.");
        } catch {
          onCommentRejected?.(tempId);
          toast.error("Could not publish that comment.");
        }
      }}
      className="mt-4 space-y-3 rounded-[1.3rem] border border-border/70 bg-black/20 p-4"
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <Textarea
        name="content"
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        className="min-h-24"
      />
      <Input name="gifUrl" placeholder="Optional GIF URL" />
      <SubmitButton variant="secondary" className="w-full sm:w-auto" pendingLabel="Sending...">
        {parentId ? "Reply" : "Comment"}
      </SubmitButton>
    </form>
  );
}
