"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { LikeButton } from "./like-button";
import { ReplyForm } from "./reply-form";
import { RepliesList } from "./replies-list";

interface ContentInteractionsProps {
  contentId: string;
  initialLikeCount?: number;
  initialReplyCount?: number;
  initialLiked?: boolean;
}

export function ContentInteractions({
  contentId,
  initialLikeCount = 0,
  initialReplyCount = 0,
  initialLiked = false,
}: ContentInteractionsProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [replyCount, setReplyCount] = useState(initialReplyCount);

  const handleReplySubmitted = () => {
    // Trigger refresh of replies list
    setRefreshTrigger((prev) => prev + 1);
    setReplyCount((prev) => prev + 1);
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <LikeButton
          contentId={contentId}
          initialLiked={initialLiked}
          initialCount={initialLikeCount}
        />
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200"
          aria-label="Toggle replies"
        >
          <MessageCircle size={16} />
          <span>{replyCount > 0 ? replyCount : ""}</span>
        </button>
      </div>

      {/* Replies Section */}
      {showReplies && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <ReplyForm
            contentId={contentId}
            onReplySubmitted={handleReplySubmitted}
          />
          <div className="border-t pt-3">
            <RepliesList
              contentId={contentId}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      )}
    </div>
  );
}
