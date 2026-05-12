import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

type SignUpPageProps = {
  searchParams: Promise<{
    attempt?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const attemptId = params.attempt ?? "";

  const attempt = attemptId
    ? await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
      })
    : null;

  const isValidAttempt = Boolean(attempt && attempt.passed && !attempt.userId);

  return (
    <AuthShell
      badge="Anonymous sign-up"
      title="Create the version of yourself the office cannot trace at a glance."
      description="Your public identity is fake by design: anonymous handle, fake Echologyx alias, and no real name on the feed."
      asideTitle="Identity rules"
      asideCopy="Public anonymity is the feature. Internal moderation is the safety net."
      bullets={[
        "Pick a fake username that does not reveal you.",
        "Choose a fake @echologyx.com alias prefix.",
        "Recovery questions can be added later from your profile.",
      ]}
    >
      {isValidAttempt ? (
        <SignUpForm attemptId={attemptId} />
      ) : (
        <div className="space-y-5 rounded-[1.6rem] border border-border/80 bg-white/4 p-6">
          <p className="text-sm leading-6 text-secondary-foreground">
            Your quiz pass is missing, expired, or already used. Take the office quiz again to
            unlock sign-up.
          </p>
          <Button asChild className="w-full">
            <Link href="/quiz">Retry the quiz</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
