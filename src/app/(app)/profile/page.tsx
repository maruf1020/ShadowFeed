import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { RecoveryForm } from "@/components/profile/recovery-form";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getInitials } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await prisma.publicProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        include: {
          recoverySetup: {
            include: { answers: true },
          },
        },
      },
    },
  });

  if (!profile) {
    return null;
  }

  const recoveryCount = profile.user.recoverySetup?.answers.length ?? 0;

  return (
    <div className="grid gap-6 pb-20 lg:grid-cols-[320px_minmax(0,1fr)] lg:pb-0">
      <Card>
        <CardHeader>
          <Badge className="w-fit">Public profile</Badge>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.username} />
              <AvatarFallback>{getInitials(profile.username)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>@{profile.username}</CardTitle>
              <p className="text-sm text-muted-foreground">{profile.fakeEmail}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>{profile.bio ?? "No bio yet."}</p>
          <div className="space-y-2 rounded-[1.4rem] border border-border/70 bg-white/4 p-4">
            <p className="font-medium text-foreground">Hint about me</p>
            <p>{profile.hintOne ?? "Hint 1 empty"}</p>
            <p>{profile.hintTwo ?? "Hint 2 empty"}</p>
            <p>{profile.hintThree ?? "Hint 3 empty"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Badge className="w-fit">Profile editor</Badge>
            <CardTitle>Shape the fake identity people see</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              avatarUrl={profile.avatarUrl}
              bio={profile.bio}
              hintOne={profile.hintOne}
              hintTwo={profile.hintTwo}
              hintThree={profile.hintThree}
              moodStatus={profile.moodStatus}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="muted" className="w-fit">
              Recovery setup
            </Badge>
            <CardTitle>Optional password recovery</CardTitle>
          </CardHeader>
          <CardContent>
            <RecoveryForm configuredCount={recoveryCount} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
