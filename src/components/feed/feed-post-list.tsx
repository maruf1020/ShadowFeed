"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PostCard, type FeedPost } from "@/components/feed/post-card";

type FeedPostListProps = {
  posts: FeedPost[];
  currentUserId: string;
  sort?: string;
  sharedPost?: FeedPost | null;
  openPostSlug?: string;
};

function mergePosts(posts: FeedPost[], sharedPost?: FeedPost | null) {
  if (!sharedPost || posts.some((post) => post.id === sharedPost.id)) {
    return posts;
  }

  return [sharedPost, ...posts];
}

export function FeedPostList({ posts, currentUserId, sort, sharedPost, openPostSlug }: FeedPostListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orderedPosts, setOrderedPosts] = useState(() => mergePosts(posts, sharedPost));

  const activePostSlug = searchParams.get("post") ?? openPostSlug ?? null;

  function setOpenPostSlug(slug: string | null) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (slug) {
      nextParams.set("post", slug);
    } else {
      nextParams.delete("post");
    }

    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handlePostActivity(postId: string) {
    if (sort && sort !== "activity") {
      return;
    }

    setOrderedPosts((currentPosts) => {
      const postIndex = currentPosts.findIndex((post) => post.id === postId);

      if (postIndex <= 0) {
        return currentPosts;
      }

      const nextPosts = [...currentPosts];
      const [activePost] = nextPosts.splice(postIndex, 1);
      nextPosts.unshift(activePost);
      return nextPosts;
    });
  }

  return orderedPosts.map((post) => (
    <PostCard
      key={post.id}
      post={post}
      currentUserId={currentUserId}
      onPostActivity={handlePostActivity}
      detailsOpen={activePostSlug === post.slug}
      onDetailsOpenChange={(open) => setOpenPostSlug(open ? post.slug : null)}
    />
  ));
}