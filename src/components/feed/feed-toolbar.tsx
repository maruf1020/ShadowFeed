import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { feedSortOptions } from "@/lib/data/feed";
import { getInitials } from "@/lib/utils";

type FeedToolbarProps = {
  user: {
    username: string;
    fakeEmail: string;
    image?: string | null;
  };
  params: {
    category?: string;
    tag?: string;
    search?: string;
    sort?: string;
  };
};

export function FeedToolbar({ user, params }: FeedToolbarProps) {
  const hasFilters = Boolean(
    params.category || params.tag || params.search || (params.sort && params.sort !== "activity"),
  );

  return (
    <div className="rounded-[1.9rem] border border-border/80 bg-card/95 p-4 shadow-[var(--shadow-card)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/feed"
            className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-primary text-lg font-semibold text-primary-foreground shadow-[var(--shadow-button)]"
          >
            S
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/feed" className="text-xl font-semibold text-foreground transition-colors hover:text-primary">
                ShadowFeed
              </Link>
              <Badge variant="muted">For you</Badge>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              A cleaner office social feed for @{user.username}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/profile"
            className="theme-panel-interactive flex items-center gap-3 rounded-full border border-border/80 bg-white/4 px-3 py-2"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image ?? undefined} alt={user.username} />
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-medium text-foreground">@{user.username}</p>
              <p className="truncate text-xs text-muted-foreground">{user.fakeEmail}</p>
            </div>
          </Link>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <form action="/feed" method="get" className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
        {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
        {params.tag ? <input type="hidden" name="tag" value={params.tag} /> : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search posts, comments, tags, polls, and office lore"
            className="h-12 rounded-full pl-11"
          />
        </div>

        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Select
            ariaLabel="Feed sort"
            name="sort"
            defaultValue={params.sort ?? "activity"}
            options={feedSortOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            className="h-12 rounded-full pl-11"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 lg:flex-none">
            Search feed
          </Button>
          {hasFilters ? (
            <Button asChild variant="outline" className="flex-1 lg:flex-none">
              <Link href="/feed">
                <X className="h-4 w-4" />
                Clear
              </Link>
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="muted">Feed sorted for fresh activity</Badge>
        {params.search ? <Badge variant="muted">Search: {params.search}</Badge> : null}
        {params.category ? <Badge variant="muted">Category: {params.category}</Badge> : null}
        {params.tag ? <Badge variant="muted">Tag: #{params.tag}</Badge> : null}
      </div>
    </div>
  );
}
