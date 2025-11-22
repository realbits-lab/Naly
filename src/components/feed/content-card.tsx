'use client';

import Link from 'next/link';
import {
  ContentCard as ContentCardType,
  formatRelativeTime,
  formatViewCount,
  CATEGORY_CONFIG,
} from '@/lib/feed/types';
import { ContentInteractions } from '@/components/interactions';

interface ContentCardProps {
  card: ContentCardType;
  showInteractions?: boolean;
}

export function ContentCard({ card, showInteractions = true }: ContentCardProps): React.ReactElement {
  const categoryConfig = CATEGORY_CONFIG[card.category];

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <Link href={`/article/${card.id}`} className="block active:scale-[0.98] transition-transform cursor-pointer">
        {/* 1. Thumbnail Image (optional) */}
        {card.thumbnailUrl && (
          <div className="relative w-full h-[140px] bg-gray-100">
            <img
              src={card.thumbnailUrl}
              alt={card.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* 2. Card Content */}
        <div className="p-4 space-y-3">
          {/* Category Badge & Time */}
          <div className="flex items-center justify-between text-xs">
            <span className={`px-2 py-0.5 rounded-full ${categoryConfig.color}`}>
              {categoryConfig.icon} {categoryConfig.label}
            </span>
            <span className="text-gray-400">
              {formatRelativeTime(card.createdAt)}
            </span>
          </div>

          {/* Title (2 lines max) */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
            {card.title}
          </h3>

          {/* Summary (3 lines max) */}
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {card.summary}
          </p>

          {/* Meta: Views & Predicted Engagement */}
          <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
            <span className="flex items-center gap-1">
              <EyeIcon />
              {formatViewCount(card.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <ChartIcon />
              {card.predictedEngagement}%
            </span>
          </div>
        </div>
      </Link>

      {/* Interactions (Like & Reply) - Outside the Link */}
      {showInteractions && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <ContentInteractions
            contentId={card.id}
            initialLikeCount={card.likeCount}
            initialReplyCount={card.replyCount}
            initialLiked={card.userLiked}
          />
        </div>
      )}
    </article>
  );
}

// Simple inline icons
function EyeIcon(): React.ReactElement {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function ChartIcon(): React.ReactElement {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
