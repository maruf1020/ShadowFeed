import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { resolveUserSettings, userSettingFeedSortOptions } from "@/lib/user-settings";

export default async function SettingsPage() {
  const user = await requireUser();
  const settingsRecord = await prisma.userSetting.findUnique({
    where: { userId: user.id },
    select: {
      defaultFeedSort: true,
      preferAnonymousPublishing: true,
      autoPromoteAnonymousPosts: true,
    },
  });
  const settings = resolveUserSettings(settingsRecord);
  const defaultSortLabel =
    userSettingFeedSortOptions.find((option) => option.value === settings.defaultFeedSort)?.label ??
    userSettingFeedSortOptions[0].label;

  return (
    <div className="grid gap-6 pb-20 lg:grid-cols-[320px_minmax(0,1fr)] lg:pb-0">
      <Card>
        <CardHeader>
          <Badge className="w-fit">Settings</Badge>
          <CardTitle>Shape how ShadowFeed behaves for you</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <div className="space-y-2 rounded-[1.4rem] border border-border/70 bg-white/4 p-4">
            <p className="font-medium text-foreground">Current defaults</p>
            <p>Feed order: {defaultSortLabel}</p>
            <p>Composer mode: {settings.preferAnonymousPublishing ? "Anonymous first" : "Named first"}</p>
            <p>
              Anonymous post reopen: {settings.autoPromoteAnonymousPosts ? "Enabled" : "Disabled"}
            </p>
          </div>

          <div className="space-y-2 rounded-[1.4rem] border border-border/70 bg-white/4 p-4">
            <p className="font-medium text-foreground">Built to grow</p>
            <p>
              This page is the base settings surface for your account, so future privacy, notification, and feed controls can land here without changing the structure again.
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">@{user.username}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Badge variant="muted" className="w-fit">
              Feed and posting
            </Badge>
            <CardTitle>Set the defaults you want every time you return</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="muted" className="w-fit">
              Next up
            </Badge>
            <CardTitle>Room for more account controls</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Privacy controls, notification switches, moderation preferences, and feed presentation options can plug into the same table and page without another schema reset.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}