import Link from "next/link";
import { PlusSquare } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type FeedStory = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  highlighted?: boolean;
};

type FeedStoriesStripProps = {
  stories: FeedStory[];
};

export function FeedStoriesStrip({ stories }: FeedStoriesStripProps) {
  return (
    <div id="feed-stories" className="border-b border-border/70 pb-5">
      <div className="feed-scroll-row flex gap-4 overflow-x-auto pb-1">
        <Link
          href="/feed?compose=1#shadowfeed-composer"
          className="group flex min-w-[4.9rem] flex-col items-center gap-2 px-1 py-1 text-center transition-transform duration-150 hover:-translate-y-0.5"
        >
          <span className="flex h-[4.65rem] w-[4.65rem] items-center justify-center rounded-full border border-dashed border-primary/40 bg-white/4 text-primary">
            <PlusSquare className="h-6 w-6" />
          </span>
          <span className="text-xs font-medium text-foreground">Your story</span>
        </Link>

        {stories.map((story) => (
          <Link
            key={story.id}
            href={story.href}
            className="group flex min-w-[4.9rem] flex-col items-center gap-2 px-1 py-1 text-center transition-transform duration-150 hover:-translate-y-0.5"
          >
            <span
              className={cn(
                "flex h-[4.65rem] w-[4.65rem] items-center justify-center rounded-full border p-[2px]",
                story.highlighted
                  ? "border-primary/40 bg-linear-to-br from-primary/25 via-primary/10 to-transparent"
                  : "border-border/80 bg-white/4",
              )}
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-card text-sm font-semibold text-foreground">
                {getInitials(story.title)}
              </span>
            </span>
            <span className="line-clamp-1 text-xs font-medium text-foreground">{story.title}</span>
            <span className="line-clamp-1 text-[0.68rem] text-muted-foreground">{story.subtitle}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}