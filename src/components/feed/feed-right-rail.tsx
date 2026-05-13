import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedDiscoverControls } from "@/components/feed/feed-discover-controls";
import { getInitials } from "@/lib/utils";

type FeedRightRailProps = {
  user: {
    username: string;
    fakeEmail: string;
    image?: string | null;
  };
  prompt?: string | null;
  tags: Array<{
    id: string;
    name: string;
  }>;
  buildFeedHref: (params: { tag?: string; category?: string; search?: string; sort?: string; limit?: string }) => string;
  params: {
    category?: string;
    tag?: string;
    sort?: string;
    search?: string;
    limit?: string;
  };
};

export function FeedRightRail({ user, prompt, tags, buildFeedHref, params }: FeedRightRailProps) {
  const suggestions = tags.slice(0, 5);

  return (
    <aside id="feed-suggestions" className="hidden xl:block">
      <div className="sticky top-6 space-y-6 pt-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.image ?? undefined} alt={user.username} />
            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">@{user.username}</p>
            <p className="truncate text-sm text-muted-foreground">{user.fakeEmail}</p>
          </div>
          <Link href="/profile" className="text-xs font-semibold text-primary transition-opacity hover:opacity-80">
            Switch
          </Link>
        </div>

        <FeedDiscoverControls
          params={params}
          buildFeedHref={buildFeedHref}
        />

        {prompt ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Prompt of the day: <span className="text-foreground">{prompt}</span>
          </p>
        ) : null}

        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-foreground">Suggested for you</h2>
            <Link href="#feed-stories" className="text-xs font-semibold text-foreground transition-opacity hover:opacity-80">
              See all
            </Link>
          </div>

          <div className="space-y-4">
            {suggestions.map((tag) => (
              <Link
                key={tag.id}
                href={buildFeedHref({
                  tag: tag.name,
                  category: params.category,
                  search: params.search,
                  sort: params.sort,
                  limit: params.limit,
                })}
                className="flex items-center gap-3"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-white/4 text-sm font-semibold text-foreground">
                  {getInitials(tag.name)}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">#{tag.name}</p>
                  <p className="text-xs text-muted-foreground">Suggested loop</p>
                </div>
                <span className="ml-auto text-sm font-semibold text-primary">Open</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3 text-xs leading-5 text-muted-foreground">
          <p>About · Help · Press · API · Jobs · Privacy · Terms</p>
          <p>Locations · Language · Meta Verified</p>
          <p>© 2026 SHADOWFEED FROM ECHOLOGYX</p>
        </div>
      </div>
    </aside>
  );
}