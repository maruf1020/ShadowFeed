"use client";

import { useActionState, useState } from "react";
import { submitSignUpAction } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usernameSuggestions } from "@/lib/constants";

export function SignUpForm({ attemptId }: { attemptId: string }) {
  const [state, formAction] = useActionState(submitSignUpAction, undefined);
  const [previewAlias, setPreviewAlias] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="attemptId" value={attemptId} />

      <div className="space-y-2">
        <Label htmlFor="username">Fake username</Label>
        <Input id="username" name="username" placeholder="ghoststack" required />
        {state?.errors?.username ? (
          <p className="text-sm text-destructive">{state.errors.username[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="aliasPrefix">Fake email prefix</Label>
        <Input
          id="aliasPrefix"
          name="aliasPrefix"
          placeholder="silentcommit"
          required
          onChange={(event) => setPreviewAlias(event.target.value.trim().toLowerCase())}
        />
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">
          Public alias: {(previewAlias || "your-alias") + "@echologyx.com"}
        </p>
        {state?.errors?.aliasPrefix ? (
          <p className="text-sm text-destructive">{state.errors.aliasPrefix[0]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password ? (
          <p className="text-sm text-destructive">{state.errors.password[0]}</p>
        ) : null}
      </div>

      <div className="rounded-[1.4rem] border border-border/80 bg-white/4 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
          Suggested anonymous handles
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {usernameSuggestions.slice(0, 6).map((suggestion) => (
            <span
              key={suggestion}
              className="rounded-full border border-border/80 px-3 py-1 text-sm text-muted-foreground"
            >
              {suggestion}
            </span>
          ))}
        </div>
      </div>

      {state?.message ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.message}
        </div>
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Creating account...">
        Create anonymous account
      </SubmitButton>
    </form>
  );
}
