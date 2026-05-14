"use server";

import { compare, hash } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { recoveryQuestionBank } from "@/lib/constants";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { passwordResetSchema, profileUpdateSchema, settingsUpdateSchema } from "@/lib/validators/account";

type ActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function normalizeRecoveryAnswer(value: string) {
  return value.trim().toLowerCase();
}

export async function updateProfileAction(
  _previousState: ActionState | undefined,
  formData: FormData,
) {
  const user = await requireUser();
  const parsed = profileUpdateSchema.safeParse({
    avatarUrl: String(formData.get("avatarUrl") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim() || undefined,
    moodStatus: String(formData.get("moodStatus") ?? "").trim() || undefined,
    hintOne: String(formData.get("hintOne") ?? "").trim() || undefined,
    hintTwo: String(formData.get("hintTwo") ?? "").trim() || undefined,
    hintThree: String(formData.get("hintThree") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the profile fields and try again.",
    };
  }

  await prisma.publicProfile.update({
    where: { userId: user.id },
    data: {
      avatarUrl: parsed.data.avatarUrl || undefined,
      bio: parsed.data.bio,
      moodStatus: parsed.data.moodStatus,
      hintOne: parsed.data.hintOne,
      hintTwo: parsed.data.hintTwo,
      hintThree: parsed.data.hintThree,
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "PROFILE_UPDATED",
    entityType: "profile",
    entityId: user.id,
  });

  return { message: "Profile updated." };
}

export async function updateRecoveryQuestionsAction(
  _previousState: ActionState | undefined,
  formData: FormData,
) {
  const user = await requireUser();
  const clearRecovery = formData.get("clearRecovery") === "on";
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for");
  const userAgent = requestHeaders.get("user-agent");

  const existingSetup = await prisma.recoveryQuestionSetup.findUnique({
    where: { userId: user.id },
    include: { answers: true },
  });

  if (clearRecovery) {
    if (existingSetup) {
      await prisma.recoveryAnswer.deleteMany({ where: { setupId: existingSetup.id } });
      await prisma.recoveryQuestionSetup.update({
        where: { id: existingSetup.id },
        data: { isComplete: false },
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: "RECOVERY_SETUP_UPDATED",
      entityType: "recovery",
      entityId: user.id,
      details: { cleared: true },
      ipAddress,
      userAgent,
    });

    return { message: "Recovery questions cleared." };
  }

  const answers = recoveryQuestionBank
    .map((question) => ({
      ...question,
      value: String(formData.get(`answer_${question.key}`) ?? "").trim(),
    }))
    .filter((question) => question.value.length > 0);

  if (!answers.length) {
    return { message: "Add at least one recovery answer or clear the setup." };
  }

  const setup =
    existingSetup ??
    (await prisma.recoveryQuestionSetup.create({
      data: {
        userId: user.id,
        isComplete: false,
      },
    }));

  for (const answer of answers) {
    await prisma.recoveryAnswer.upsert({
      where: {
        setupId_questionKey: {
          setupId: setup.id,
          questionKey: answer.key,
        },
      },
      update: {
        questionText: answer.label,
        answerHash: await hash(normalizeRecoveryAnswer(answer.value), 10),
      },
      create: {
        setupId: setup.id,
        questionKey: answer.key,
        questionText: answer.label,
        answerHash: await hash(normalizeRecoveryAnswer(answer.value), 10),
      },
    });
  }

  const storedAnswers = await prisma.recoveryAnswer.count({ where: { setupId: setup.id } });
  await prisma.recoveryQuestionSetup.update({
    where: { id: setup.id },
    data: { isComplete: storedAnswers > 0 },
  });

  await logAuditEvent({
    userId: user.id,
    action: "RECOVERY_SETUP_UPDATED",
    entityType: "recovery",
    entityId: setup.id,
    details: { storedAnswers },
    ipAddress,
    userAgent,
  });

  return { message: "Recovery setup saved." };
}

export async function updateSettingsAction(
  _previousState: ActionState | undefined,
  formData: FormData,
) {
  const user = await requireUser();
  const parsed = settingsUpdateSchema.safeParse({
    defaultFeedSort: String(formData.get("defaultFeedSort") ?? "").trim(),
    preferAnonymousPublishing: formData.get("preferAnonymousPublishing") === "on",
    autoPromoteAnonymousPosts: formData.get("autoPromoteAnonymousPosts") === "on",
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the settings fields and try again.",
    };
  }

  await prisma.userSetting.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...parsed.data,
    },
    update: parsed.data,
  });

  return { message: "Settings updated." };
}

export async function resetPasswordAction(
  _previousState: ActionState | undefined,
  formData: FormData,
) {
  const parsed = passwordResetSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the reset form and try again.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: {
      recoverySetup: {
        include: {
          answers: true,
        },
      },
    },
  });

  if (!user?.recoverySetup?.isComplete || !user.recoverySetup.answers.length) {
    return { message: "Recovery is not configured for this account." };
  }

  for (const answer of user.recoverySetup.answers) {
    const inputValue = String(formData.get(`answer_${answer.questionKey}`) ?? "");
    const isMatch = await compare(normalizeRecoveryAnswer(inputValue), answer.answerHash);

    if (!isMatch) {
      return { message: "Recovery answers did not match. Try again." };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hash(parsed.data.password, 10),
    },
  });

  await logAuditEvent({
    userId: user.id,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "user",
    entityId: user.id,
  });

  redirect("/login?reset=1");
}
