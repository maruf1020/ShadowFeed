import Link from "next/link";
import { FeedPostList } from "@/components/feed/feed-post-list";
import { FeedToolbar } from "@/components/feed/feed-toolbar";
import { RecoveryReminder } from "@/components/feed/recovery-reminder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostComposer } from "@/components/feed/post-composer";
import { feedSortOptions, getFeedPageData } from "@/lib/data/feed";
import { postCategoryOptions } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type FeedPageProps = {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    search?: string;
    sort?: string;
    limit?: string;
  }>;
};

function buildFeedHref(params: {
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
  limit?: string;
}) {
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

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = {
    category: params.category,
    tag: params.tag,
    search: params.search,
    sort: params.sort,
    limit: params.limit,
  };
  const [{ posts, prompt, tags, hasMore, nextLimit }, recoverySetup] = await Promise.all([
    getFeedPageData(filters),
    prisma.recoveryQuestionSetup.findUnique({ where: { userId: user.id } }),
  ]);
  const activeSort =
    feedSortOptions.find((option) => option.value === params.sort)?.label ?? "Latest activity";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      {!recoverySetup?.isComplete ? <RecoveryReminder /> : null}
      <div className="xl:col-span-2">
        <FeedToolbar user={user} params={params} />
      </div>

      <div className="space-y-6 pb-20 lg:pb-0">
        <Card>
          <CardHeader>
            <Badge className="w-fit">ShadowFeed live</Badge>
            <CardTitle className="text-3xl">Today I want to say...</CardTitle>
          </CardHeader>
          <CardContent>
            <PostComposer />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Filters and sorting</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href={buildFeedHref({ search: params.search, sort: params.sort })}>
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
                })}
              >
                <Badge variant={params.category === category.value ? "solid" : "muted"}>
                  {category.label}
                </Badge>
              </Link>
            ))}
            {params.tag ? (
              <Link
                href={buildFeedHref({
                  category: params.category,
                  search: params.search,
                  sort: params.sort,
                })}
              >
                <Badge>Clear tag #{params.tag}</Badge>
              </Link>
            ) : null}
            <Badge variant="muted">Sort: {activeSort}</Badge>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {posts.length ? (
            <>
              <FeedPostList
                key={buildFeedHref(filters)}
                posts={posts as never}
                currentUserId={user.id}
                sort={params.sort}
              />

              <Card>
                <CardContent className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {posts.length} latest posts{hasMore ? ". Load more when you need them." : ". You are caught up."}
                  </p>
                  {hasMore ? (
                    <Button asChild variant="outline">
                      <Link
                        href={buildFeedHref({
                          category: params.category,
                          tag: params.tag,
                          search: params.search,
                          sort: params.sort,
                          limit: String(nextLimit),
                        })}
                      >
                        Load more posts
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No posts match this filter yet. Start the thread.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <aside className="space-y-6 pb-20 lg:pb-0">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Daily prompt</Badge>
            <CardTitle>{prompt?.prompt ?? "What silently annoyed you today?"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Use it as a confession, a poll prompt, or a short developer shower thought.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="muted" className="w-fit">
              Trending tags
            </Badge>
            <CardTitle className="text-xl">Browse the current office loops</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={buildFeedHref({
                  category: params.category,
                  tag: tag.name,
                  search: params.search,
                  sort: params.sort,
                })}
              >
                <Badge variant={params.tag === tag.name ? "solid" : "muted"}>#{tag.name}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
