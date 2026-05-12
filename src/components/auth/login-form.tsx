"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/validators/auth";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null);

    const result = await signIn("credentials", {
      identifier: values.identifier,
      password: values.password,
      redirect: false,
      callbackUrl: "/feed",
    });

    if (!result || result.error) {
      setMessage("Login failed. Check your anonymous handle and password.");
      return;
    }

    router.push(result.url ?? "/feed");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="identifier">Fake username or fake email</Label>
        <Input
          id="identifier"
          placeholder="ghoststack or ghoststack@echologyx.com"
          {...form.register("identifier")}
        />
        {form.formState.errors.identifier ? (
          <p className="text-sm text-destructive">{form.formState.errors.identifier.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {message ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {message}
        </div>
      ) : null}

      <div className="rounded-[1.4rem] border border-border/80 bg-white/4 px-4 py-4 text-sm leading-6 text-muted-foreground">
        Password recovery becomes available after you add recovery questions from your profile.
        If you skip that step, there is no reset path.
      </div>

      <SubmitButton
        size="lg"
        className="w-full"
        pendingLabel="Logging in..."
        disabled={form.formState.isSubmitting}
      >
        Log in to ShadowFeed
      </SubmitButton>

      <p className="text-sm text-muted-foreground">
        No anonymous account yet?{" "}
        <Link href="/quiz" className="text-primary transition-colors hover:text-primary/80">
          Take the office quiz first
        </Link>
        .
      </p>
    </form>
  );
}
