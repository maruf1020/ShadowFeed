"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusSquare } from "lucide-react";
import { PostComposer } from "@/components/feed/post-composer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";

type FeedComposerCardProps = {
  user: {
    username: string;
    image?: string | null;
  };
};

export function FeedComposerCard({ user }: FeedComposerCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [composerVersion, setComposerVersion] = useState(0);

  return (
    <div id="shadowfeed-composer" className="rounded-[1.45rem] border border-border/70 bg-white/4 p-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.image ?? undefined} alt={user.username} />
          <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
        </Avatar>

          <DialogTrigger asChild>
            <button
              type="button"
              className="theme-panel-interactive flex flex-1 items-center justify-between rounded-full border border-border/80 bg-background px-5 py-4 text-left"
            >
              <span className="text-sm text-muted-foreground">Share an update, a meme, or a short office confession...</span>
              <PlusSquare className="h-5 w-5 text-primary" />
            </button>
          </DialogTrigger>
        </div>

        <DialogContent className="max-h-[90vh] max-w-2xl p-0">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Create post</DialogTitle>
            <DialogDescription>
              Simple public post with category, image upload, direct paste support, and searchable GIFs.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-5.5rem)] overflow-y-auto px-6 py-5">
            <PostComposer
              key={composerVersion}
              user={user}
              onPublished={() => {
                setOpen(false);
                setComposerVersion((current) => current + 1);
                startTransition(() => {
                  router.refresh();
                });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}