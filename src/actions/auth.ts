"use server";

import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validators/auth";

type QuizGateState = {
  message?: string;
};

type SignUpState = {
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitQuizGateAction(
  _previousState: QuizGateState | undefined,
  formData: FormData,
) {
  const questionIds = formData.getAll("questionId").map(String);

  if (!questionIds.length) {
    return { message: "Quiz questions are unavailable right now." };
  }

  const questions = await prisma.quizQuestion.findMany({
    where: {
      id: { in: questionIds },
      isActive: true,
    },
    include: {
      options: {
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  const answers = questions.map((question) => {
    const selectedOptionId = String(formData.get(`question_${question.id}`) ?? "");
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);

    return {
      questionId: question.id,
      selectedOptionId,
      isCorrect: Boolean(selectedOption?.isCorrect),
    };
  });

  if (answers.some((answer) => !answer.selectedOptionId)) {
    return { message: "Answer all four questions before continuing." };
  }

  const score = answers.filter((answer) => answer.isCorrect).length;
  const passingScore = Math.ceil(questions.length * 0.75);
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent");

  const attempt = await prisma.quizAttempt.create({
    data: {
      sessionKey: crypto.randomUUID(),
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
      passed: score >= passingScore,
      score,
      totalQuestions: questions.length,
      answers: {
        create: answers.map((answer) => ({
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          isCorrect: answer.isCorrect,
        })),
      },
    },
  });

  await logAuditEvent({
    action: score >= passingScore ? "QUIZ_PASSED" : "QUIZ_FAILED",
    entityType: "quizAttempt",
    entityId: attempt.id,
    details: {
      score,
      totalQuestions: questions.length,
    },
    ipAddress,
    userAgent,
  });

  if (score < passingScore) {
    return {
      message: `You need ${passingScore}/${questions.length} correct answers to continue.`,
    };
  }

  redirect(`/sign-up?attempt=${attempt.id}`);
}

export async function submitSignUpAction(
  _previousState: SignUpState | undefined,
  formData: FormData,
) {
  const parsed = signUpSchema.safeParse({
    attemptId: formData.get("attemptId"),
    username: formData.get("username"),
    aliasPrefix: formData.get("aliasPrefix"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the highlighted fields and try again.",
    };
  }

  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent");
  const { attemptId, aliasPrefix, password, username } = parsed.data;
  const fakeEmail = `${aliasPrefix}@echologyx.com`;

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || !attempt.passed) {
    return { message: "Your quiz pass is missing or expired. Please retry the quiz." };
  }

  if (attempt.userId) {
    return { message: "This quiz pass has already been used." };
  }

  const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 2);
  if (attempt.createdAt < twoHoursAgo) {
    return { message: "Your quiz pass expired. Please take the quiz again." };
  }

  const existingProfile = await prisma.publicProfile.findFirst({
    where: {
      OR: [{ username }, { fakeEmail }],
    },
  });

  if (existingProfile) {
    return {
      message:
        existingProfile.username === username
          ? "That fake username is already taken."
          : "That fake email alias is already taken.",
    };
  }

  const passwordHash = await hash(password, 10);

  const createdUser = await prisma.user.create({
    data: {
      passwordHash,
      quizPassedAt: new Date(),
      settings: {
        create: {},
      },
      publicProfile: {
        create: {
          username,
          fakeEmail,
          moodStatus: "debugging...",
        },
      },
    },
    include: {
      publicProfile: true,
    },
  });

  await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: { userId: createdUser.id },
  });

  await logAuditEvent({
    userId: createdUser.id,
    action: "USER_CREATED",
    entityType: "user",
    entityId: createdUser.id,
    details: {
      username,
      fakeEmail,
      attemptId,
    },
    ipAddress,
    userAgent,
  });

  redirect(`/login?registered=1&handle=${username}`);
}
