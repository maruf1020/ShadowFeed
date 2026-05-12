import { z } from "zod";

const optionalUrl = z.union([
  z.literal(""),
  z.string().url("Enter a valid URL."),
]);

export const postFormSchema = z
  .object({
    category: z.enum([
      "CONFESSION",
      "UNPOPULAR_OPINION",
      "FUNNY_MOMENT",
      "WORK_STRUGGLE",
      "SECRET_WIN",
      "RANDOM_THOUGHT",
      "SUGGESTION",
      "MEME",
      "POLL",
    ]),
    title: z.string().max(120, "Title must be at most 120 characters.").optional(),
    content: z.string().min(8, "Post content must be at least 8 characters."),
    gifUrl: optionalUrl,
    imageUrl: optionalUrl,
    tags: z.string().max(120).optional(),
    pollQuestion: z.string().max(220).optional(),
    pollOptionOne: z.string().max(120).optional(),
    pollOptionTwo: z.string().max(120).optional(),
    pollOptionThree: z.string().max(120).optional(),
    allowComments: z.boolean(),
    isAnonymous: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.category === "POLL") {
      if (!value.pollQuestion?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Poll posts need a poll question.",
          path: ["pollQuestion"],
        });
      }

      const pollOptions = [value.pollOptionOne, value.pollOptionTwo, value.pollOptionThree].filter(
        (option) => option?.trim(),
      );

      if (pollOptions.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least two poll options.",
          path: ["pollOptionOne"],
        });
      }
    }
  });

export const reactionSchema = z.object({
  reactionType: z.enum([
    "LAUGH",
    "SKULL",
    "FIRE",
    "COFFEE",
    "MELTING",
    "BRAIN",
    "SAME_BRO",
    "LEGEND",
  ]),
  postId: z.string().optional(),
  commentId: z.string().optional(),
});

export const commentSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().optional(),
  content: z.string().min(2, "Comment must be at least 2 characters."),
  gifUrl: optionalUrl,
});

export const pollVoteSchema = z.object({
  pollId: z.string().min(1),
  optionId: z.string().min(1),
});
