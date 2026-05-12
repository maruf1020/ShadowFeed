import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.string().url("Enter a valid URL.")]);

export const profileUpdateSchema = z.object({
  avatarUrl: optionalUrl,
  bio: z.string().max(200, "Bio must be at most 200 characters.").optional(),
  moodStatus: z.string().max(32, "Mood must be at most 32 characters.").optional(),
  hintOne: z.string().max(20, "Hint one must be 20 characters or fewer.").optional(),
  hintTwo: z.string().max(20, "Hint two must be 20 characters or fewer.").optional(),
  hintThree: z.string().max(20, "Hint three must be 20 characters or fewer.").optional(),
});

export const passwordResetSchema = z.object({
  userId: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must include a letter.")
    .regex(/[0-9]/, "Password must include a number."),
});
