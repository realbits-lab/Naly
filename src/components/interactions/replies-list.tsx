"use client";

import { useState, useEffect } from "react";
import { MessageCircle, User } from "lucide-react";
import { formatRelativeTime } from "@/lib/feed/types";

interface Reply {
  id: string;
  contentId: string;
  userId: string;
  content: string;
  parentReplyId: string | null;
  createdAt: string;
  user?: {
    name: string;
    isAnonymous: boolean;
  };
}

interface RepliesListProps {
  contentId: string;
  refreshTrigger?: number;
}

export function RepliesList({ contentId, refreshTrigger = 0 }: RepliesListProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReplies();
  }, [contentId, refreshTrigger]);

  const fetchReplies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/replies?contentId=${contentId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch replies");
      }

      const data = await response.json();
      setReplies(data.replies || []);
    } catch (error) {
      console.error("Error fetching replies:", error);
      setError("Failed to load replies");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={fetchReplies}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div className="py-8 text-center">
        <MessageCircle size={32} className="mx-auto text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">No replies yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {reply.user?.isAnonymous ? "Anonymous User" : reply.user?.name || "User"}
                </span>
                {reply.user?.isAnonymous && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    Guest
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(reply.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700 break-words">{reply.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
