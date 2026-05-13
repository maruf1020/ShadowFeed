import Link from "next/link";
import { FeedComposerCard } from "@/components/feed/feed-composer-card";
import { FeedDesktopSidebar, FeedMobileBottomNav } from "@/components/feed/feed-primary-nav";
import { FeedPostList } from "@/components/feed/feed-post-list";
import { RecoveryReminder } from "@/components/feed/recovery-reminder";
import { Button } from "@/components/ui/button";
import { getFeedPageData, getPostBySlug } from "@/lib/data/feed";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type FeedPageProps = {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    search?: string;
    sort?: string;
    limit?: string;
    post?: string;
  }>;
};

function buildFeedHref(params: {
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
  limit?: string;
  post?: string;
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

  if (params.post) {
    query.set("post", params.post);
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

  const [{ posts, hasMore, nextLimit }, recoverySetup, sharedPost] = await Promise.all([
    getFeedPageData(filters),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        recoverySetup: {
          select: { isComplete: true },
        },
      },
    }),
    params.post ? getPostBySlug(params.post) : Promise.resolve(null),
  ]);

  const feedPostListKey = [
    buildFeedHref({ ...filters, post: params.post }),
    posts.map((post) => post.id).join(","),
    sharedPost?.id ?? "",
  ].join("::");

  return (
    <div className="feed-experience min-h-screen">
      <div className="mx-auto grid max-w-[1040px] gap-6 px-4 pb-24 pt-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6 lg:pb-10">
        <FeedDesktopSidebar />

        <div className="min-w-0">
          <div className="mx-auto max-w-[720px] space-y-6">
            <FeedComposerCard user={user} />

            {!recoverySetup?.recoverySetup?.isComplete ? <RecoveryReminder /> : null}

            <div className="space-y-0">
              {posts.length ? (
                <>
                  <FeedPostList
                    key={feedPostListKey}
                    posts={posts as never}
                    currentUserId={user.id}
                    sort={params.sort}
                    sharedPost={sharedPost as never}
                    openPostSlug={params.post}
                  />

                  <div className="border-t border-border/70 py-6 text-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-muted-foreground">
                        Showing {posts.length} posts in the main feed
                        {hasMore ? ". Load more to keep scrolling." : ". You are caught up."}
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
                              post: params.post,
                            })}
                          >
                            Load more posts
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-border/70 bg-white/4 px-5 py-10 text-center text-muted-foreground">
                  No posts match this filter yet. Start the thread.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FeedMobileBottomNav />
    </div>
  );
}
