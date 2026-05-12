"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitQuizGateAction } from "@/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

type QuizQuestion = {
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
  }>;
};

export function QuizGateForm({ questions }: { questions: QuizQuestion[] }) {
  const [state, formAction] = useActionState(submitQuizGateAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {questions.map((question, index) => (
        <Card key={question.id} className="p-0">
          <CardHeader className="border-b border-border/70 px-5 py-5">
            <Badge variant="muted" className="w-fit">
              Question 0{index + 1}
            </Badge>
            <CardTitle className="text-lg">{question.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-5 py-5">
            <input type="hidden" name="questionId" value={question.id} />
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/80 bg-white/4 px-4 py-3 text-sm text-secondary-foreground transition-colors hover:bg-white/8"
              >
                <input
                  required
                  type="radio"
                  name={`question_${question.id}`}
                  value={option.id}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      {state?.message ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {state.message}
        </div>
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Checking answers...">
        Continue to anonymous sign-up
      </SubmitButton>
    </form>
  );
}
