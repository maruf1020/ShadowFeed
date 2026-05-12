"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/actions/account";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordResetFormProps = {
  userId: string;
  questions: Array<{
    key: string;
    label: string;
  }>;
};

export function PasswordResetForm({ userId, questions }: PasswordResetFormProps) {
  const [state, formAction] = useActionState(resetPasswordAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />

      {questions.map((question) => (
        <div key={question.key} className="space-y-2">
          <Label htmlFor={`reset-${question.key}`}>{question.label}</Label>
          <Input id={`reset-${question.key}`} name={`answer_${question.key}`} required />
        </div>
      ))}

      <div className="space-y-2">
        <Label htmlFor="reset-password">New password</Label>
        <Input id="reset-password" name="password" type="password" required />
        {state?.errors?.password ? (
          <p className="text-sm text-destructive">{state.errors.password[0]}</p>
        ) : null}
      </div>

      {state?.message ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.message}
        </div>
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Resetting password...">
        Reset password
      </SubmitButton>
    </form>
  );
}
