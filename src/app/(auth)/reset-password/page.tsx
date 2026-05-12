import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    alias?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const alias = params.alias?.trim().toLowerCase() ?? "";
  const profile = alias
    ? await prisma.publicProfile.findFirst({
        where: {
          OR: [{ username: alias }, { fakeEmail: alias }],
        },
        include: {
          user: {
            include: {
              recoverySetup: {
                include: { answers: true },
              },
            },
          },
        },
      })
    : null;

  const recoveryQuestions = profile?.user.recoverySetup?.answers ?? [];
  const canReset = Boolean(profile && profile.user.recoverySetup?.isComplete && recoveryQuestions.length);

  return (
    <AuthShell
      badge="Password reset"
      title="Recover your anonymous account if you prepared for it."
      description="If recovery questions were never set from profile, there is no password reset path for that account."
      asideTitle="Reset rules"
      asideCopy="Recovery is optional at first, but it becomes the only way back if you forget your password."
      bullets={[
        "Look up your account with fake username or fake alias.",
        "Answer the saved recovery questions exactly.",
        "Set a brand new password once the answers match.",
      ]}
    >
      <form method="get" className="space-y-4 rounded-[1.6rem] border border-border/80 bg-white/4 p-5">
        <div className="space-y-2">
          <Label htmlFor="reset-alias">Fake username or fake email</Label>
          <Input id="reset-alias" name="alias" defaultValue={alias} placeholder="ghoststack or ghoststack@echologyx.com" />
        </div>
        <Button className="w-full">Load recovery questions</Button>
      </form>

      {alias ? (
        canReset ? (
          <div className="mt-5 rounded-[1.6rem] border border-border/80 bg-white/4 p-5">
            <PasswordResetForm
              userId={profile!.userId}
              questions={recoveryQuestions.map((question) => ({
                key: question.questionKey,
                label: question.questionText,
              }))}
            />
          </div>
        ) : (
          <div className="mt-5 rounded-[1.6rem] border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive-foreground">
            This account either does not exist or has no recovery questions configured.
          </div>
        )
      ) : null}
    </AuthShell>
  );
}
