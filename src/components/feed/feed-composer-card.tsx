"use client";

import { startTransition, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PenSquare, PlusSquare } from "lucide-react";
import { PostComposer } from "@/components/feed/post-composer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";

type FeedComposerCardProps = {
  user: {
    username: string;
    image?: string | null;
  };
  hideTrigger?: boolean;
};

export function FeedComposerCard({ user, hideTrigger = false }: FeedComposerCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [composerVersion, setComposerVersion] = useState(0);
  const open = searchParams.get("compose") === "1";

  function setComposerOpen(nextOpen: boolean) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextOpen) {
      nextParams.set("compose", "1");
    } else {
      nextParams.delete("compose");
    }

    const query = nextParams.toString();
    const href = query ? `${pathname}?${query}#shadowfeed-composer` : `${pathname}#shadowfeed-composer`;

    router.replace(href, { scroll: false });
  }

  return (
    <Dialog open={open} onOpenChange={setComposerOpen}>
      {hideTrigger ? null : (
        <div className="rounded-[1.6rem] border border-border/70 bg-card/95 p-4 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)] sm:p-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image ?? undefined} alt={user.username} />
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="theme-panel-interactive flex flex-1 items-center justify-between rounded-[1.35rem] border border-border/80 bg-background px-5 py-4 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Create post</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  General is preselected. Add text, images, GIFs, or switch to anonymous before publishing.
                </p>
              </div>

              <div className="ml-4 flex shrink-0 items-center gap-2">
                <Badge className="hidden px-2.5 py-1 text-[0.62rem] tracking-[0.14em] sm:inline-flex">GENERAL</Badge>
                <PlusSquare className="h-5 w-5 text-primary" />
              </div>
            </button>
          </div>
        </div>
      )}

      <DialogContent className="max-h-[92vh] max-w-3xl p-0">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <PenSquare className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Create post</DialogTitle>
              <DialogDescription>
                Cleaner composer with a compact type picker, anonymous mode, image upload, direct paste, and GIF search.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-5.5rem)] overflow-y-auto px-6 py-5">
          <PostComposer
            key={composerVersion}
            user={user}
            onPublished={(payload) => {
              setComposerOpen(false);
              setComposerVersion((current) => current + 1);

              startTransition(() => {
                if (payload?.revealOnTop && payload.postSlug) {
                  const nextParams = new URLSearchParams();
                  nextParams.set("sort", "newest");
                  nextParams.set("post", payload.postSlug);
                  router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
                  return;
                }

                router.refresh();
              });
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}