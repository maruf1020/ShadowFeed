import type { PostCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FeedFilters = {
  category?: string;
  tag?: string;
  search?: string;
};

export async function getFeedPageData(filters: FeedFilters) {
  const where: Prisma.PostWhereInput = {
    status: "ACTIVE",
    ...(filters.category && filters.category !== "ALL"
      ? { category: filters.category as PostCategory }
      : {}),
    ...(filters.tag
      ? {
          tags: {
            some: {
              tag: {
                name: filters.tag,
              },
            },
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { content: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [posts, tags, prompt] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ trendingScore: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          include: {
            publicProfile: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        reactions: true,
        comments: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              include: {
                publicProfile: true,
              },
            },
            replies: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "asc" },
              include: {
                author: {
                  include: {
                    publicProfile: true,
                  },
                },
              },
            },
          },
        },
        poll: {
          include: {
            options: {
              orderBy: { displayOrder: "asc" },
              include: {
                votes: true,
              },
            },
            votes: true,
          },
        },
      },
      take: 20,
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.dailyPrompt.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { posts, tags, prompt };
}
