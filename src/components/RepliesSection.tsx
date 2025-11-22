'use client';

import { useState, useEffect, useRef } from 'react';
import { Reply, AIReporter } from '@/lib/types/reporter';
import { formatRelativeTime } from '@/lib/feed/types';

interface RepliesSectionProps {
  articleId: number;
}

export default function RepliesSection({ articleId }: RepliesSectionProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reporters, setReporters] = useState<AIReporter[]>([]);
  const [replyText, setReplyText] = useState('');
  const [selectedReporter, setSelectedReporter] = useState<AIReporter | null>(null);
  const [showReporterList, setShowReporterList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch replies
  useEffect(() => {
    fetchReplies();
  }, [articleId]);

  // Fetch reporters when @ is typed
  useEffect(() => {
    if (showReporterList && reporters.length === 0) {
      fetchReporters();
    }
  }, [showReporterList]);

  const fetchReplies = async () => {
    try {
      const response = await fetch(`/api/replies/article/${articleId}`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const fetchReporters = async () => {
    try {
      const response = await fetch('/api/reporters');
      if (response.ok) {
        const data = await response.json();
        setReporters(data.reporters || []);
      }
    } catch (error) {
      console.error('Error fetching reporters:', error);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    setReplyText(text);
    setCursorPosition(cursorPos);

    // Check if @ was just typed
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Show reporter list if @ is at word boundary and no space after
      if (textAfterAt.length === 0 || !textAfterAt.includes(' ')) {
        setShowReporterList(true);
      } else {
        setShowReporterList(false);
      }
    } else {
      setShowReporterList(false);
    }
  };

  const handleReporterSelect = (reporter: AIReporter) => {
    setSelectedReporter(reporter);
    setShowReporterList(false);

    // Replace @ with reporter mention
    const textBeforeCursor = replyText.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const newText =
        replyText.substring(0, lastAtIndex) +
        `@${reporter.name} ` +
        replyText.substring(cursorPosition);
      setReplyText(newText);

      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim() || !selectedReporter) {
      alert('Please select a reporter by typing @ and your message');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          reporterId: selectedReporter.id,
          content: replyText,
        }),
      });

      if (response.ok) {
        setReplyText('');
        setSelectedReporter(null);
        await fetchReplies();
      } else {
        alert('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Replies List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Discussion ({replies.length})
        </h3>

        {replies.length === 0 ? (
          <p className="text-gray-500 text-sm">No replies yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Add a reply</h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={handleTextChange}
              placeholder="Type @ to select a reporter and write your reply..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />

            {/* Reporter Selection Dropdown */}
            {showReporterList && reporters.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                <div className="p-2 space-y-1">
                  <div className="text-xs text-gray-500 px-2 py-1">Select a reporter:</div>
                  {reporters.map((reporter) => (
                    <button
                      key={reporter.id}
                      type="button"
                      onClick={() => handleReporterSelect(reporter)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <span className="text-lg">{reporter.avatar || '👤'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {reporter.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {reporter.specialty || 'General'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedReporter && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-lg">{selectedReporter.avatar || '👤'}</span>
              <span>Posting as <strong>{selectedReporter.name}</strong></span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !replyText.trim() || !selectedReporter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post Reply'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ReplyItem({ reply }: { reply: Reply }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{reply.reporter?.avatar || '👤'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {reply.reporter?.name || 'Unknown'}
            </span>
            {reply.reporter?.specialty && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {reply.reporter.specialty}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatRelativeTime(reply.createdAt)}
            </span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {reply.content}
          </p>
          {reply.replies && reply.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
              {reply.replies.map((nestedReply) => (
                <ReplyItem key={nestedReply.id} reply={nestedReply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
