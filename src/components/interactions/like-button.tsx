"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface LikeButtonProps {
  contentId: string;
  initialLiked?: boolean;
  initialCount?: number;
}

export function LikeButton({ contentId, initialLiked = false, initialCount = 0 }: LikeButtonProps) {
  const { data: session, isPending } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial like status when session is ready
  useEffect(() => {
    if (!isPending && session) {
      fetchLikeStatus();
    }
  }, [contentId, session, isPending]);

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/likes?contentId=${contentId}`);
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching like status:", error);
    }
  };

  const handleLike = async () => {
    if (isLoading || isPending) return;

    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : count - 1;
    setLiked(newLiked);
    setCount(newCount);
    setIsLoading(true);

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentId }),
      });

      if (!response.ok) {
        // Revert on error
        setLiked(!newLiked);
        setCount(count);

        if (response.status === 401) {
          console.error("Not authenticated");
        } else {
          console.error("Failed to toggle like");
        }
      } else {
        const data = await response.json();
        setLiked(data.liked);
        // Refetch to get accurate count
        fetchLikeStatus();
      }
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setCount(count);
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading || isPending}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
        liked
          ? "bg-pink-100 text-pink-600 hover:bg-pink-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        size={16}
        className={`transition-all ${liked ? "fill-pink-600" : "fill-none"}`}
      />
      <span>{count > 0 ? count : ""}</span>
    </button>
  );
}
