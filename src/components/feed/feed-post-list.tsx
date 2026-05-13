"use client";

import { useState } from "react";
import { PostCard, type FeedPost } from "@/components/feed/post-card";

type FeedPostListProps = {
  posts: FeedPost[];
  currentUserId: string;
  sort?: string;
};

export function FeedPostList({ posts, currentUserId, sort }: FeedPostListProps) {
  const [orderedPosts, setOrderedPosts] = useState(posts);

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
    <PostCard key={post.id} post={post} currentUserId={currentUserId} onPostActivity={handlePostActivity} />
  ));
}