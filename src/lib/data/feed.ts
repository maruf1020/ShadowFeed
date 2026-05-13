import type { PostCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const feedPostInclude = {
  author: {
    include: {
      publicProfile: true,
    },
  },
  images: {
    orderBy: { displayOrder: "asc" },
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
      reactions: true,
      author: {
        include: {
          publicProfile: true,
        },
      },
      replies: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        include: {
          reactions: true,
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
} satisfies Prisma.PostInclude;

export const feedSortOptions = [
  { value: "activity", label: "Latest activity" },
  { value: "newest", label: "Newest posts" },
  { value: "trending", label: "Most heated" },
  { value: "comments", label: "Most discussed" },
] as const;

export type FeedSort = (typeof feedSortOptions)[number]["value"];

type FeedFilters = {
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
  limit?: string;
};

const defaultFeedLimit = 10;
const maxFeedLimit = 60;
const feedLimitStep = 10;

function getFeedSort(sort?: string): FeedSort {
  if (feedSortOptions.some((option) => option.value === sort)) {
    return sort as FeedSort;
  }

  return "activity";
}

function getFeedOrder(sort: FeedSort): Prisma.PostOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }, { id: "desc" }];
    case "trending":
      return [{ trendingScore: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }];
    case "comments":
      return [{ commentCount: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }];
    case "activity":
    default:
      return [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }];
  }
}

function getFeedLimit(limit?: string) {
  const parsed = Number(limit ?? defaultFeedLimit);

  if (!Number.isFinite(parsed)) {
    return defaultFeedLimit;
  }

  return Math.min(Math.max(Math.floor(parsed), defaultFeedLimit), maxFeedLimit);
}

export async function getFeedPageData(filters: FeedFilters) {
  const searchTerm = filters.search?.trim();
  const sort = getFeedSort(filters.sort);
  const limit = getFeedLimit(filters.limit);
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
    ...(searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { content: { contains: searchTerm, mode: "insensitive" } },
            { excerpt: { contains: searchTerm, mode: "insensitive" } },
            {
              tags: {
                some: {
                  tag: {
                    name: { contains: searchTerm, mode: "insensitive" },
                  },
                },
              },
            },
            {
              comments: {
                some: {
                  status: "ACTIVE",
                  content: { contains: searchTerm, mode: "insensitive" },
                },
              },
            },
            {
              poll: {
                is: {
                  OR: [
                    { question: { contains: searchTerm, mode: "insensitive" } },
                    {
                      options: {
                        some: {
                          label: { contains: searchTerm, mode: "insensitive" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [posts, tags, prompt] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: getFeedOrder(sort),
      include: feedPostInclude,
      take: limit + 1,
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.dailyPrompt.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasMore = posts.length > limit;

  return {
    posts: posts.slice(0, limit),
    tags,
    prompt,
    hasMore,
    nextLimit: Math.min(limit + feedLimitStep, maxFeedLimit),
  };
}

export async function getPostBySlug(slug: string) {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) {
    return null;
  }

  return prisma.post.findFirst({
    where: {
      slug: normalizedSlug,
      status: "ACTIVE",
    },
    include: feedPostInclude,
  });
}
