import Link from "next/link";
import { RecoveryReminder } from "@/components/feed/recovery-reminder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/feed/post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { getFeedPageData } from "@/lib/data/feed";
import { postCategoryOptions } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type FeedPageProps = {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    search?: string;
  }>;
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = {
    category: params.category,
    tag: params.tag,
    search: params.search,
  };
  const [{ posts, prompt, tags }, recoverySetup] = await Promise.all([
    getFeedPageData(filters),
    prisma.recoveryQuestionSetup.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      {!recoverySetup?.isComplete ? <RecoveryReminder /> : null}
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
            <CardTitle className="text-xl">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/feed">
              <Badge variant={!params.category ? "solid" : "muted"}>All</Badge>
            </Link>
            {postCategoryOptions.map((category) => (
              <Link key={category.value} href={`/feed?category=${category.value}`}>
                <Badge variant={params.category === category.value ? "solid" : "muted"}>
                  {category.label}
                </Badge>
              </Link>
            ))}
            {params.tag ? (
              <Link href="/feed">
                <Badge>Clear tag #{params.tag}</Badge>
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {posts.length ? (
            posts.map((post) => <PostCard key={post.id} post={post as never} currentUserId={user.id} />)
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
              <Link key={tag.id} href={`/feed?tag=${tag.name}`}>
                <Badge variant={params.tag === tag.name ? "solid" : "muted"}>#{tag.name}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
