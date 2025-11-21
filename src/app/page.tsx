'use client';

import { useEffect } from 'react';
import {
  ContentCard,
  SkeletonFeed,
  AdCardPlaceholder,
  ScrollToTopFAB,
  CollapsibleHeader,
} from '@/components/feed';
import { useFeed, useInfiniteScroll, usePullToRefresh } from '@/hooks/use-feed';
import { generateFeedItemsWithAds, FEED_LIMITS } from '@/lib/feed/types';

export default function FeedPage(): React.ReactElement {
  const { state, loadMore, refresh, loadNewer } = useFeed();
  const { isRefreshing, pullDistance } = usePullToRefresh(refresh);

  // 1. Initial load
  useEffect(() => {
    if (state.cards.length === 0 && !state.isLoading) {
      loadMore();
    }
  }, []);

  // 2. Infinite scroll hook
  useInfiniteScroll(loadMore, {
    threshold: 0.8,
    enabled: state.hasMore && !state.isLoading,
  });

  // 3. Generate feed items with ads interspersed
  const feedItems = generateFeedItemsWithAds(state.cards);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 4. Collapsible Header */}
      <CollapsibleHeader title="NALY" />

      {/* 5. Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-14 left-0 right-0 flex justify-center z-30 transition-transform"
          style={{ transform: `translateY(${Math.min(pullDistance, 60)}px)` }}
        >
          <div className={`w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      )}

      {/* 6. Main content area */}
      <main className="max-w-lg mx-auto px-4 pt-16 pb-8">
        {/* Load newer button (when recycled items exist) */}
        {state.hasRecycledItems && (
          <button
            onClick={loadNewer}
            className="w-full mb-4 py-3 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            Load newer posts
          </button>
        )}

        {/* 7. Feed content */}
        {state.cards.length === 0 && state.isLoading ? (
          <SkeletonFeed count={5} />
        ) : (
          <div className="flex flex-col gap-8">
            {feedItems.map((item, index) => {
              if (item.type === 'ad') {
                return <AdCardPlaceholder key={`ad-${index}`} />;
              }
              if (item.data) {
                return <ContentCard key={item.data.id} card={item.data} />;
              }
              return null;
            })}

            {/* 8. Loading more indicator */}
            {state.isLoading && state.cards.length > 0 && (
              <div className="py-8 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading more...</span>
              </div>
            )}

            {/* 9. End of feed message */}
            {!state.hasMore && state.cards.length >= FEED_LIMITS.MAX_FEED_ITEMS && (
              <div className="py-8 text-center">
                <p className="text-gray-500 font-medium">You're all caught up!</p>
                <p className="text-sm text-gray-400 mt-1">
                  {state.cards.length} articles loaded
                </p>
                <button
                  onClick={loadMore}
                  className="mt-4 px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}

        {/* 10. Error state */}
        {state.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{state.error}</p>
            <button
              onClick={() => loadMore()}
              className="mt-2 text-red-700 text-sm font-medium underline"
            >
              Try again
            </button>
          </div>
        )}
      </main>

      {/* 11. Scroll to top FAB */}
      <ScrollToTopFAB />
    </div>
  );
}
