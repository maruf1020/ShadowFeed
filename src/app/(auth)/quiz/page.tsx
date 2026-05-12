import { AuthShell } from "@/components/auth/auth-shell";
import { QuizGateForm } from "@/components/auth/quiz-gate-form";
import { prisma } from "@/lib/prisma";

export default async function QuizPage() {
  const questions = await prisma.quizQuestion.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    take: 4,
    include: {
      options: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  return (
    <AuthShell
      badge="Quiz gate"
      title="Prove you belong inside the office lore."
      description="Four lightweight company questions protect the feed without making the sign-up flow feel like paperwork."
      asideTitle="Before sign-up"
      asideCopy="Pass the office quiz, then claim a fake handle and step into the feed."
      bullets={[
        "Answer four internal office questions.",
        "Hit at least 75% to continue to sign-up.",
        "Your pass unlocks one anonymous account creation window.",
      ]}
    >
      <QuizGateForm
        questions={questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          options: question.options.map((option) => ({
            id: option.id,
            label: option.label,
          })),
        }))}
      />
    </AuthShell>
  );
}
