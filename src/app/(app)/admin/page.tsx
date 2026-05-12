import { moderatePostAction, toggleUserSuspensionAction } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function AdminPage() {
  await requireAdmin();

  const [userCount, postCount, activeSuspensions, posts] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.suspension.findMany({ where: { isActive: true }, include: { user: { include: { publicProfile: true } } } }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        author: {
          include: {
            publicProfile: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Accounts</Badge>
            <CardTitle>{userCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Badge className="w-fit">Posts</Badge>
            <CardTitle>{postCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Badge className="w-fit">Active suspensions</Badge>
            <CardTitle>{activeSuspensions.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <Badge className="w-fit">Moderation feed</Badge>
          <CardTitle>Map anonymous content to internal accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-[1.4rem] border border-border/70 bg-white/4 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{post.title ?? post.slug}</p>
                  <p className="text-sm text-muted-foreground">Status: {post.status}</p>
                  <p className="text-sm text-muted-foreground">
                    Internal author: @{post.author.publicProfile?.username} · {post.author.publicProfile?.fakeEmail}
                  </p>
                  <p className="text-xs font-mono text-primary">User ID: {post.authorId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Set active", status: "ACTIVE" },
                    { label: "Hide", status: "HIDDEN" },
                    { label: "Remove", status: "REMOVED" },
                  ].map((option) => (
                    <form key={option.status} action={moderatePostAction}>
                      <input type="hidden" name="postId" value={post.id} />
                      <input type="hidden" name="status" value={option.status} />
                      <Button variant="outline" size="sm">
                        {option.label}
                      </Button>
                    </form>
                  ))}
                  <form action={toggleUserSuspensionAction}>
                    <input type="hidden" name="userId" value={post.authorId} />
                    <input type="hidden" name="mode" value="suspend" />
                    <Button variant="secondary" size="sm">
                      Suspend user
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant="muted" className="w-fit">
            Suspensions
          </Badge>
          <CardTitle>Current user restrictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSuspensions.length ? (
            activeSuspensions.map((suspension) => (
              <div key={suspension.id} className="rounded-[1.4rem] border border-border/70 bg-white/4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      @{suspension.user.publicProfile?.username} · {suspension.type}
                    </p>
                    <p className="text-sm text-muted-foreground">{suspension.reason}</p>
                  </div>
                  <form action={toggleUserSuspensionAction}>
                    <input type="hidden" name="userId" value={suspension.userId} />
                    <input type="hidden" name="mode" value="restore" />
                    <Button variant="outline" size="sm">
                      Restore access
                    </Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No active suspensions right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
