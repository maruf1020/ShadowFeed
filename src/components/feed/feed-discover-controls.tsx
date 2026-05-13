import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { postCategoryOptions } from "@/lib/constants";
import { feedSortOptions } from "@/lib/data/feed";

type DiscoverParams = {
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
  limit?: string;
};

type FeedDiscoverControlsProps = {
  params: DiscoverParams;
  buildFeedHref: (params: DiscoverParams) => string;
  className?: string;
};

export function FeedDiscoverControls({ params, buildFeedHref, className }: FeedDiscoverControlsProps) {
  const hasFilters = Boolean(
    params.category || params.tag || params.search || (params.sort && params.sort !== "activity"),
  );

  return (
    <section id="feed-discovery" className={className}>
      <form action="/feed" method="get" className="space-y-3 rounded-[1.6rem] border border-border/70 bg-card/90 p-4">
        {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
        {params.tag ? <input type="hidden" name="tag" value={params.tag} /> : null}
        {params.limit ? <input type="hidden" name="limit" value={params.limit} /> : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search feed"
            className="h-11 rounded-full pl-11"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Select
              ariaLabel="Feed sort"
              name="sort"
              defaultValue={params.sort ?? "activity"}
              options={feedSortOptions.map((option) => ({ value: option.value, label: option.label }))}
              className="h-11 rounded-full pl-11"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 sm:flex-none">
              Search
            </Button>
            {hasFilters ? (
              <Button asChild variant="outline" className="flex-1 sm:flex-none">
                <Link href="/feed">
                  <X className="h-4 w-4" />
                  Clear
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={buildFeedHref({ search: params.search, sort: params.sort, limit: params.limit })}>
          <Badge variant={!params.category ? "solid" : "muted"}>All</Badge>
        </Link>
        {postCategoryOptions.map((category) => (
          <Link
            key={category.value}
            href={buildFeedHref({
              category: category.value,
              tag: params.tag,
              search: params.search,
              sort: params.sort,
              limit: params.limit,
            })}
          >
            <Badge variant={params.category === category.value ? "solid" : "muted"}>{category.label}</Badge>
          </Link>
        ))}
        {params.tag ? <Badge variant="muted">#{params.tag}</Badge> : null}
      </div>
    </section>
  );
}