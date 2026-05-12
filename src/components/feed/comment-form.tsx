import { createCommentAction } from "@/actions/feed";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({ postId, parentId }: { postId: string; parentId?: string }) {
  return (
    <form action={createCommentAction} className="mt-4 space-y-3 rounded-[1.3rem] border border-border/70 bg-black/20 p-4">
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
