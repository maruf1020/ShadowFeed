"use client";

import { useActionState } from "react";
import { updateRecoveryQuestionsAction } from "@/actions/account";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recoveryQuestionBank } from "@/lib/constants";

export function RecoveryForm({ configuredCount }: { configuredCount: number }) {
  const [state, formAction] = useActionState(updateRecoveryQuestionsAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-[1.6rem] border border-border/80 bg-card p-6">
      <div className="rounded-[1.4rem] border border-border/70 bg-white/4 px-4 py-4 text-sm leading-6 text-muted-foreground">
        Recovery is optional, but if you skip it there is no password reset path. Current saved
        recovery answers: {configuredCount}.
      </div>

      <div className="grid gap-4">
        {recoveryQuestionBank.map((question) => (
          <div key={question.key} className="space-y-2">
            <Label htmlFor={`answer-${question.key}`}>{question.label}</Label>
            <Input id={`answer-${question.key}`} name={`answer_${question.key}`} placeholder="Add or replace answer" />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-3 text-sm text-secondary-foreground">
        <input type="checkbox" name="clearRecovery" className="h-4 w-4 accent-[var(--primary)]" />
        Clear all recovery answers instead of updating them
      </label>

      {state?.message ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.message}
        </div>
      ) : null}

      <SubmitButton size="lg" className="w-full sm:w-auto" pendingLabel="Saving recovery setup...">
        Save recovery setup
      </SubmitButton>
    </form>
  );
}
