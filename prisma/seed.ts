import { hash } from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  dailyPrompts,
  defaultTags,
  quizSeedQuestions,
} from "../src/lib/constants";

const prisma = new PrismaClient();

async function upsertProfile(input: {
  fakeEmail: string;
  username: string;
  passwordHash: string;
  role?: UserRole;
  avatarUrl?: string;
  bio?: string;
  hintOne?: string;
  hintTwo?: string;
  hintThree?: string;
  moodStatus?: string;
}) {
  return prisma.publicProfile.upsert({
    where: { fakeEmail: input.fakeEmail },
    update: {
      username: input.username,
      avatarUrl: input.avatarUrl,
      bio: input.bio,
      hintOne: input.hintOne,
      hintTwo: input.hintTwo,
      hintThree: input.hintThree,
      moodStatus: input.moodStatus,
      user: {
        update: {
          passwordHash: input.passwordHash,
          role: input.role ?? UserRole.USER,
          quizPassedAt: new Date(),
        },
      },
    },
    create: {
      fakeEmail: input.fakeEmail,
      username: input.username,
      avatarUrl: input.avatarUrl,
      bio: input.bio,
      hintOne: input.hintOne,
      hintTwo: input.hintTwo,
      hintThree: input.hintThree,
      moodStatus: input.moodStatus,
      user: {
        create: {
          passwordHash: input.passwordHash,
          role: input.role ?? UserRole.USER,
          quizPassedAt: new Date(),
        },
      },
    },
    include: {
      user: true,
    },
  });
}

async function seedQuiz() {
  for (const [questionIndex, question] of quizSeedQuestions.entries()) {
    const quizQuestion = await prisma.quizQuestion.upsert({
      where: { slug: question.slug },
      update: {
        prompt: question.prompt,
        explanation: question.explanation,
        displayOrder: questionIndex,
        isActive: true,
      },
      create: {
        slug: question.slug,
        prompt: question.prompt,
        explanation: question.explanation,
        displayOrder: questionIndex,
        isActive: true,
      },
    });

    await prisma.quizOption.deleteMany({ where: { questionId: quizQuestion.id } });

    await prisma.quizOption.createMany({
      data: question.options.map((option, optionIndex) => ({
        questionId: quizQuestion.id,
        label: option.label,
        isCorrect: option.isCorrect,
        displayOrder: optionIndex,
      })),
    });
  }
}

async function seedTagsAndPrompts() {
  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tag },
      update: {},
      create: { name: tag },
    });
  }

  for (const prompt of dailyPrompts) {
    await prisma.dailyPrompt.upsert({
      where: { prompt },
      update: { isActive: true },
      create: { prompt, isActive: true },
    });
  }
}

async function seedPosts() {
  const defaultPassword = await hash(
    process.env.SEED_DEFAULT_PASSWORD ?? "ShadowFeed!2026",
    10,
  );
  const adminPassword = await hash(
    process.env.SEED_ADMIN_PASSWORD ?? "ShadowFeedAdmin!2026",
    10,
  );

  const admin = await upsertProfile({
    fakeEmail: "rootkernel@echologyx.com",
    username: "rootkernel",
    passwordHash: adminPassword,
    role: UserRole.ADMIN,
    avatarUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=400&q=80",
    bio: "Keeps the shadows stable.",
    hintOne: "night deploys",
    hintTwo: "tea over coffee",
    hintThree: "reads logs",
    moodStatus: "fixing prod",
  });

  const ghost = await upsertProfile({
    fakeEmail: "ghoststack@echologyx.com",
    username: "ghoststack",
    passwordHash: defaultPassword,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    bio: "Frontend rumors and midnight merges.",
    hintOne: "late commits",
    hintTwo: "prefers dark",
    hintThree: "coffee loop",
    moodStatus: "debugging...",
  });

  const merge = await upsertProfile({
    fakeEmail: "midnightmerge@echologyx.com",
    username: "midnightmerge",
    passwordHash: defaultPassword,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    bio: "Backend whispers and suspiciously clean standups.",
    hintOne: "owns tabs",
    hintTwo: "merge queue",
    hintThree: "canteen fan",
    moodStatus: "surviving meetings",
  });

  const postDefinitions = [
    {
      slug: "meeting-could-have-been-readme",
      authorId: ghost.userId,
      category: "CONFESSION" as const,
      content:
        "I am convinced half our weekly syncs could be replaced by a markdown checklist and one emoji reaction.",
      excerpt: "Half our syncs could be a README and one emoji.",
      allowComments: true,
      isAnonymous: true,
      heatLevel: 78,
      trendingScore: 91,
      reactionCount: 4,
      commentCount: 2,
      pollVoteCount: 0,
      tags: ["meeting", "office-tea", "standup"],
    },
    {
      slug: "fixed-the-bug-accidentally",
      authorId: merge.userId,
      category: "FUNNY_MOMENT" as const,
      content:
        "Changed one line, sighed dramatically, refreshed the page, and now I am apparently the hero of sprint review.",
      excerpt: "Accidental heroics are still heroics.",
      allowComments: true,
      isAnonymous: true,
      heatLevel: 63,
      trendingScore: 74,
      reactionCount: 3,
      commentCount: 1,
      pollVoteCount: 0,
      tags: ["buglife", "deploy", "afterhours"],
    },
    {
      slug: "remote-or-office-productivity",
      authorId: admin.userId,
      category: "POLL" as const,
      content:
        "Be honest. Where does your code ship cleaner: remote setup or office setup?",
      excerpt: "Remote or office? Anonymous votes only.",
      allowComments: false,
      isAnonymous: true,
      heatLevel: 88,
      trendingScore: 96,
      reactionCount: 2,
      commentCount: 0,
      pollVoteCount: 2,
      tags: ["remote-work", "meeting"],
      poll: {
        question: "Remote or office?",
        options: ["Remote", "Office", "Hybrid chaos"],
      },
    },
  ];

  for (const definition of postDefinitions) {
    const post = await prisma.post.upsert({
      where: { slug: definition.slug },
      update: {
        authorId: definition.authorId,
        category: definition.category,
        content: definition.content,
        excerpt: definition.excerpt,
        allowComments: definition.allowComments,
        isAnonymous: definition.isAnonymous,
        heatLevel: definition.heatLevel,
        trendingScore: definition.trendingScore,
        reactionCount: definition.reactionCount,
        commentCount: definition.commentCount,
        pollVoteCount: definition.pollVoteCount,
      },
      create: {
        authorId: definition.authorId,
        slug: definition.slug,
        category: definition.category,
        content: definition.content,
        excerpt: definition.excerpt,
        allowComments: definition.allowComments,
        isAnonymous: definition.isAnonymous,
        heatLevel: definition.heatLevel,
        trendingScore: definition.trendingScore,
        reactionCount: definition.reactionCount,
        commentCount: definition.commentCount,
        pollVoteCount: definition.pollVoteCount,
      },
    });

    await prisma.postTag.deleteMany({ where: { postId: post.id } });

    for (const tagName of definition.tags) {
      const tag = await prisma.tag.findUnique({ where: { name: tagName } });
      if (tag) {
        await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
      }
    }

    if (definition.poll) {
      const poll = await prisma.poll.upsert({
        where: { postId: post.id },
        update: { question: definition.poll.question },
        create: {
          postId: post.id,
          question: definition.poll.question,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      await prisma.pollOption.deleteMany({ where: { pollId: poll.id } });

      for (const [index, option] of definition.poll.options.entries()) {
        await prisma.pollOption.create({
          data: { pollId: poll.id, label: option, displayOrder: index },
        });
      }
    }
  }

  const confessionPost = await prisma.post.findUnique({
    where: { slug: "meeting-could-have-been-readme" },
  });
  const pollPost = await prisma.post.findUnique({
    where: { slug: "remote-or-office-productivity" },
  });

  if (confessionPost) {
    await prisma.comment.upsert({
      where: { id: `${confessionPost.id}-first-comment` },
      update: {
        content: "Same bro. I only need the final decision and the action items.",
      },
      create: {
        id: `${confessionPost.id}-first-comment`,
        postId: confessionPost.id,
        authorId: merge.userId,
        content: "Same bro. I only need the final decision and the action items.",
        isAnonymous: true,
      },
    });

    await prisma.comment.upsert({
      where: { id: `${confessionPost.id}-second-comment` },
      update: {
        content: "Please do not let the meeting owner see this post.",
      },
      create: {
        id: `${confessionPost.id}-second-comment`,
        postId: confessionPost.id,
        authorId: admin.userId,
        content: "Please do not let the meeting owner see this post.",
        isAnonymous: true,
      },
    });
  }

  const reactions = [
    { slug: "meeting-could-have-been-readme", userId: admin.userId, type: "SAME_BRO" },
    { slug: "meeting-could-have-been-readme", userId: merge.userId, type: "LAUGH" },
    { slug: "fixed-the-bug-accidentally", userId: admin.userId, type: "LEGEND" },
    { slug: "fixed-the-bug-accidentally", userId: ghost.userId, type: "FIRE" },
    { slug: "remote-or-office-productivity", userId: ghost.userId, type: "COFFEE" },
  ] as const;

  for (const reaction of reactions) {
    const targetPost = await prisma.post.findUnique({ where: { slug: reaction.slug } });
    if (!targetPost) {
      continue;
    }

    await prisma.reaction.upsert({
      where: {
        userId_postId: {
          userId: reaction.userId,
          postId: targetPost.id,
        },
      },
      update: { type: reaction.type },
      create: {
        userId: reaction.userId,
        type: reaction.type,
        postId: targetPost.id,
      },
    });
  }

  if (pollPost) {
    const poll = await prisma.poll.findUnique({
      where: { postId: pollPost.id },
      include: { options: true },
    });

    if (poll && poll.options.length >= 2) {
      await prisma.pollVote.upsert({
        where: {
          pollId_userId: {
            pollId: poll.id,
            userId: ghost.userId,
          },
        },
        update: { optionId: poll.options[0].id },
        create: {
          pollId: poll.id,
          optionId: poll.options[0].id,
          userId: ghost.userId,
        },
      });

      await prisma.pollVote.upsert({
        where: {
          pollId_userId: {
            pollId: poll.id,
            userId: merge.userId,
          },
        },
        update: { optionId: poll.options[2]?.id ?? poll.options[1].id },
        create: {
          pollId: poll.id,
          optionId: poll.options[2]?.id ?? poll.options[1].id,
          userId: merge.userId,
        },
      });
    }
  }
}

async function seedAuditLog() {
  const adminProfile = await prisma.publicProfile.findUnique({
    where: { fakeEmail: "rootkernel@echologyx.com" },
    include: { user: true },
  });

  if (!adminProfile) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      userId: adminProfile.userId,
      action: "ADMIN_NOTE_ADDED",
      entityType: "system",
      entityId: "shadowfeed-seed",
      details: {
        note: "Initial ShadowFeed seed data loaded.",
      },
    },
  });
}

async function main() {
  await seedQuiz();
  await seedTagsAndPrompts();
  await seedPosts();
  await seedAuditLog();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
