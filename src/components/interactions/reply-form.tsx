"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface ReplyFormProps {
  contentId: string;
  onReplySubmitted?: () => void;
  parentReplyId?: string;
  placeholder?: string;
}

export function ReplyForm({
  contentId,
  onReplySubmitted,
  parentReplyId,
  placeholder = "Write a reply..."
}: ReplyFormProps) {
  const { data: session, isPending } = useSession();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting || isPending) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentId,
          content: content.trim(),
          parentReplyId: parentReplyId || null,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please wait while we create your session...");
        } else {
          setError("Failed to submit reply. Please try again.");
        }
        return;
      }

      const data = await response.json();
      setContent("");
      onReplySubmitted?.();
    } catch (error) {
      console.error("Error submitting reply:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          disabled={isSubmitting || isPending}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting || isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Send reply"
        >
          <Send size={18} />
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {session?.user?.isAnonymous && (
        <p className="text-xs text-gray-500">
          Posting as a guest. Your reply will be anonymous.
        </p>
      )}
    </form>
  );
}
