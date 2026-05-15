import Link from "next/link";
import { FeedFooterLinks } from "@/components/feed/feed-footer-links";
import { getInitials } from "@/lib/utils";

type FeedRightRailProps = {
  tags: Array<{
    id: string;
    name: string;
  }>;
  params: {
    category?: string;
    tag?: string;
    sort?: string;
    search?: string;
    limit?: string;
  };
};

function buildTagFeedHref(params: { tag?: string; category?: string; search?: string; sort?: string; limit?: string }) {
  const query = new URLSearchParams();

  if (params.category) {
    query.set("category", params.category);
  }

  if (params.tag) {
    query.set("tag", params.tag);
  }

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.sort && params.sort !== "activity") {
    query.set("sort", params.sort);
  }

  if (params.limit) {
    query.set("limit", params.limit);
  }

  const queryString = query.toString();
  return queryString ? `/feed?${queryString}` : "/feed";
}

export function FeedRightRail({ tags, params }: FeedRightRailProps) {
  const suggestions = tags.slice(0, 5);

  return (
    <aside id="feed-suggestions" className="py-6 hidden lg:block">
      <div className="space-y-5">
        <div className="rounded-[1.6rem] border border-border/70 bg-card/90 p-5">
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
                href={buildTagFeedHref({
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
                  <p className="text-sm font-medium capitalize text-foreground">{tag.name.replaceAll("-", " ")}</p>
                  <p className="text-xs text-muted-foreground">Suggested topic</p>
                </div>
                <span className="ml-auto text-sm font-semibold text-primary">Open</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3 px-1 text-xs leading-5 text-muted-foreground">
          <FeedFooterLinks />
          <p>
            © 2026 SHADOWFEED FROM {" "}
            <Link
              href="https://github.com/maruf1020"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground transition-opacity hover:opacity-80"
            >
              MARUF1020
            </Link>
          </p>
        </div>
      </div>
    </aside>
  );
}