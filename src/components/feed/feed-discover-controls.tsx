"use client";

import { useTransition } from "react";
import { SlidersHorizontal, Tags } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { postCategoryOptions } from "@/lib/constants";
import { feedSortOptions } from "@/lib/data/feed";
import { cn } from "@/lib/utils";

type DiscoverParams = {
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
};

type FeedDiscoverControlsProps = {
  params: DiscoverParams;
  className?: string;
};

function buildFeedFilterHref(
  pathname: string,
  searchParamsString: string,
  nextValues: { category?: string; sort?: string },
) {
  const nextParams = new URLSearchParams(searchParamsString);

  if (nextValues.category !== undefined) {
    if (!nextValues.category || nextValues.category === "ALL") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", nextValues.category);
    }
  }

  if (nextValues.sort !== undefined) {
    if (!nextValues.sort || nextValues.sort === "activity") {
      nextParams.delete("sort");
    } else {
      nextParams.set("sort", nextValues.sort);
    }
  }

  nextParams.delete("post");
  nextParams.delete("compose");

  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function FeedDiscoverControls({ params, className }: FeedDiscoverControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeCategory = searchParams.get("category") ?? params.category ?? "ALL";
  const activeSort = searchParams.get("sort") ?? params.sort ?? "activity";
  const activeSearch = searchParams.get("search") ?? params.search ?? "";

  function updateFeedControls(nextValues: { category?: string; sort?: string }) {
    const href = buildFeedFilterHref(pathname, searchParams.toString(), nextValues);

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <section id="feed-discovery" className={cn("space-y-2", className)}>
      <div className={cn("grid max-w-105 gap-2 sm:grid-cols-2", isPending && "opacity-80")}>
        <div className="relative">
          <Tags className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Select
            ariaLabel="Post type"
            value={activeCategory}
            options={[
              { value: "ALL", label: "All" },
              ...postCategoryOptions.map((option) => ({ value: option.value, label: option.label })),
            ]}
            onValueChange={(value) => updateFeedControls({ category: value })}
            className="h-10 rounded-full border-border/70 bg-card/70 pl-10 text-sm"
          />
        </div>

        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Select
            ariaLabel="Feed sort"
            value={activeSort}
            options={feedSortOptions.map((option) => ({ value: option.value, label: option.label }))}
            onValueChange={(value) => updateFeedControls({ sort: value })}
            className="h-10 rounded-full border-border/70 bg-card/70 pl-10 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeSearch ? <Badge variant="muted">Search: {activeSearch}</Badge> : null}
      </div>
    </section>
  );
}