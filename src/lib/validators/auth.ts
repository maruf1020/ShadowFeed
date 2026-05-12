import { z } from "zod";

const slugPattern = /^[a-z][a-z0-9-]{2,19}$/;

export const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your fake username or alias."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signUpSchema = z.object({
  attemptId: z.string().min(1, "Missing quiz attempt."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be at most 20 characters.")
    .regex(slugPattern, "Use lowercase letters, numbers, or hyphens only."),
  aliasPrefix: z
    .string()
    .min(3, "Alias prefix must be at least 3 characters.")
    .max(24, "Alias prefix must be at most 24 characters.")
    .regex(slugPattern, "Use lowercase letters, numbers, or hyphens only."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must include at least one letter.")
    .regex(/[0-9]/, "Password must include at least one number."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
