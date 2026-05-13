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
    <div className="glass-panel theme-floating-shadow rounded-[1.6rem] border border-border/80 p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image ?? undefined} alt={user.username} />
            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
              Feed control room
            </p>
            <p className="mt-1 truncate text-base font-medium text-foreground">@{user.username}</p>
            <p className="truncate text-sm text-muted-foreground">{user.fakeEmail}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <form action="/feed" method="get" className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
        {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
        {params.tag ? <input type="hidden" name="tag" value={params.tag} /> : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search posts, comments, tags, polls, and office lore"
            className="pl-11"
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
            className="pl-11"
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
        <Badge variant="muted">Latest activity first</Badge>
        {params.search ? <Badge variant="muted">Search: {params.search}</Badge> : null}
        {params.category ? <Badge variant="muted">Category: {params.category}</Badge> : null}
        {params.tag ? <Badge variant="muted">Tag: #{params.tag}</Badge> : null}
      </div>
    </div>
  );
}
