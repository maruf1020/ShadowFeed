import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string;
    handle?: string;
    reset?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const showRegisteredMessage = params.registered === "1";

  return (
    <AuthShell
      badge="Log in"
      title="Re-enter the feed with your fake identity."
      description="Use your anonymous handle or fake alias to get back into ShadowFeed. The public mask stays fake even when the session is real."
      asideTitle="Back to the shadows"
      asideCopy="Once you are in, the next steps are profile hints, recovery setup, and the feed itself."
      bullets={[
        "Log in with your fake username or fake email alias.",
        "Password resets only work after recovery questions are configured.",
        "Admins can moderate behavior, but other users never see your real trace.",
      ]}
    >
      {showRegisteredMessage ? (
        <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          Account created for @{params.handle ?? "your-handle"}. Log in to enter ShadowFeed.
        </div>
      ) : null}
      {params.reset === "1" ? (
        <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          Password reset complete. Log in with the new password.
        </div>
      ) : null}
      <LoginForm />
      <p className="mt-5 text-sm text-muted-foreground">
        Need your first anonymous identity?{" "}
        <Link href="/quiz" className="text-primary transition-colors hover:text-primary/80">
          Start at the quiz gate
        </Link>
        {" "}or{" "}
        <Link href="/reset-password" className="text-primary transition-colors hover:text-primary/80">
          recover an existing account
        </Link>
        .
      </p>
    </AuthShell>
  );
}
