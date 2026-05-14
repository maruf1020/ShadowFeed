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
  reactions: {
    include: {
      user: {
        include: {
          publicProfile: true,
        },
      },
    },
  },
  comments: {
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    include: {
      reactions: {
        include: {
          user: {
            include: {
              publicProfile: true,
            },
          },
        },
      },
      author: {
        include: {
          publicProfile: true,
        },
      },
      replies: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        include: {
          reactions: {
            include: {
              user: {
                include: {
                  publicProfile: true,
                },
              },
            },
          },
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
  const rawSearchTerm = filters.search?.trim();
  const hashtagTokens = rawSearchTerm
    ? Array.from(new Set(Array.from(rawSearchTerm.matchAll(/#([a-z0-9_-]+)/gi), (match) => match[1].trim()).filter(Boolean)))
    : [];
  const textSearchTerm = rawSearchTerm?.replace(/#[a-z0-9_-]+/gi, " ").replace(/\s+/g, " ").trim();
  const normalizedSearchTerm = textSearchTerm || rawSearchTerm?.replace(/#/g, " ").replace(/\s+/g, " ").trim();
  const sort = getFeedSort(filters.sort);
  const limit = getFeedLimit(filters.limit);
  const searchClauses: Prisma.PostWhereInput[] = [];

  if (normalizedSearchTerm) {
    searchClauses.push(
      { title: { contains: normalizedSearchTerm, mode: "insensitive" } },
      { content: { contains: normalizedSearchTerm, mode: "insensitive" } },
      { excerpt: { contains: normalizedSearchTerm, mode: "insensitive" } },
      {
        tags: {
          some: {
            tag: {
              name: { contains: normalizedSearchTerm, mode: "insensitive" },
            },
          },
        },
      },
      {
        comments: {
          some: {
            status: "ACTIVE",
            content: { contains: normalizedSearchTerm, mode: "insensitive" },
          },
        },
      },
      {
        poll: {
          is: {
            OR: [
              { question: { contains: normalizedSearchTerm, mode: "insensitive" } },
              {
                options: {
                  some: {
                    label: { contains: normalizedSearchTerm, mode: "insensitive" },
                  },
                },
              },
            ],
          },
        },
      },
    );
  }

  if (hashtagTokens.length) {
    searchClauses.push({
      tags: {
        some: {
          tag: {
            OR: hashtagTokens.map((token) => ({
              name: { contains: token, mode: "insensitive" },
            })),
          },
        },
      },
    });
  }

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
    ...(searchClauses.length ? { OR: searchClauses } : {}),
  };

  const [posts, tags] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: getFeedOrder(sort),
      include: feedPostInclude,
      take: limit + 1,
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const hasMore = posts.length > limit;

  return {
    posts: posts.slice(0, limit),
    tags,
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
