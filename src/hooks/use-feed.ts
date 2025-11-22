'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import useSWR from 'swr';
import {
  ContentCard,
  FeedState,
  FeedResponse,
  FEED_LIMITS,
} from '@/lib/feed/types';
import { getLocalCache, setLocalCache, LOCAL_CACHE_TTL } from '@/lib/local-storage-cache';

interface UseFeedOptions {
  initialCards?: ContentCard[];
}

interface UseFeedReturn {
  state: FeedState;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  loadNewer: () => Promise<void>;
}

export function useFeed(options: UseFeedOptions = {}): UseFeedReturn {
  const { initialCards = [] } = options;

  const [state, setState] = useState<FeedState>({
    cards: initialCards,
    currentPage: 0, // Start at 0 so first loadMore fetches page 1
    hasMore: true,
    hasRecycledItems: false,
    oldestVisibleId: null,
    newestVisibleId: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
  });

  const recycledCardsRef = useRef<ContentCard[]>([]);

  // 1. SWR fetcher with local storage caching
  const fetcher = async (url: string): Promise<FeedResponse> => {
    // Try local storage cache first
    const cacheKey = url.replace('/api/', '');
    const cached = getLocalCache<FeedResponse>(cacheKey, {
      prefix: 'feed',
      ttl: LOCAL_CACHE_TTL.SHORT,
    });

    if (cached) {
      return cached;
    }

    // Fetch from API with ETag support
    const response = await fetch(url, {
      headers: {
        'If-None-Match': '', // Will be populated by browser cache
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch feed');
    }

    const data = await response.json();

    // Cache in local storage
    setLocalCache(cacheKey, data, {
      prefix: 'feed',
      ttl: LOCAL_CACHE_TTL.SHORT,
    });

    return data;
  };

  // 2. Fetch feed data from API
  const fetchFeed = async (page: number): Promise<FeedResponse> => {
    return fetcher(`/api/feed?page=${page}&limit=${FEED_LIMITS.ITEMS_PER_PAGE}`);
  };

  // 2. Load more cards (scroll down)
  const loadMore = useCallback(async (): Promise<void> => {
    if (state.isLoading || !state.hasMore) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const nextPage = state.currentPage + 1;
      const data = await fetchFeed(nextPage);

      setState((prev) => {
        // Deduplicate by ID
        const existingIds = new Set(prev.cards.map(c => c.id));
        const newItems = data.items.filter(item => !existingIds.has(item.id));

        let newCards = [...prev.cards, ...newItems];
        let hasRecycledItems = prev.hasRecycledItems;

        // 3. Apply bounded scroll limit (like Twitter/X)
        if (newCards.length > FEED_LIMITS.MAX_FEED_ITEMS) {
          const itemsToRecycle = newCards.length - FEED_LIMITS.MAX_FEED_ITEMS;
          const recycled = newCards.slice(0, itemsToRecycle);
          recycledCardsRef.current = [...recycled, ...recycledCardsRef.current];
          newCards = newCards.slice(itemsToRecycle);
          hasRecycledItems = true;
        }

        return {
          ...prev,
          cards: newCards,
          currentPage: nextPage,
          hasMore: data.hasMore,
          hasRecycledItems,
          oldestVisibleId: newCards[0]?.id || null,
          newestVisibleId: newCards[newCards.length - 1]?.id || null,
          isLoading: false,
        };
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load more',
      }));
    }
  }, [state.isLoading, state.hasMore, state.currentPage]);

  // 4. Refresh feed (pull-to-refresh)
  const refresh = useCallback(async (): Promise<void> => {
    if (state.isRefreshing) return;

    setState((prev) => ({ ...prev, isRefreshing: true, error: null }));

    try {
      const data = await fetchFeed(1);

      // Clear recycled cards on refresh
      recycledCardsRef.current = [];

      setState({
        cards: data.items,
        currentPage: 1,
        hasMore: data.hasMore,
        hasRecycledItems: false,
        oldestVisibleId: data.items[0]?.id || null,
        newestVisibleId: data.items[data.items.length - 1]?.id || null,
        isLoading: false,
        isRefreshing: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Failed to refresh',
      }));
    }
  }, [state.isRefreshing]);

  // 5. Load newer/recycled cards (scroll up past boundary)
  const loadNewer = useCallback(async (): Promise<void> => {
    if (!state.hasRecycledItems || recycledCardsRef.current.length === 0) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    // Restore recycled cards
    const cardsToRestore = recycledCardsRef.current.slice(-FEED_LIMITS.ITEMS_PER_PAGE);
    recycledCardsRef.current = recycledCardsRef.current.slice(0, -FEED_LIMITS.ITEMS_PER_PAGE);

    setState((prev) => {
      let newCards = [...cardsToRestore, ...prev.cards];

      // Remove from bottom to maintain limit
      if (newCards.length > FEED_LIMITS.MAX_FEED_ITEMS) {
        newCards = newCards.slice(0, FEED_LIMITS.MAX_FEED_ITEMS);
      }

      return {
        ...prev,
        cards: newCards,
        hasRecycledItems: recycledCardsRef.current.length > 0,
        oldestVisibleId: newCards[0]?.id || null,
        isLoading: false,
      };
    });
  }, [state.hasRecycledItems]);

  return {
    state,
    loadMore,
    refresh,
    loadNewer,
  };
}

// 6. Hook for infinite scroll detection
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: { threshold?: number; enabled?: boolean } = {}
): void {
  const { threshold = 0.8, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = (): void => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage > threshold) {
        onLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, threshold, enabled]);
}

// 7. Hook for pull-to-refresh
export function usePullToRefresh(onRefresh: () => Promise<void>): {
  isRefreshing: boolean;
  pullDistance: number;
} {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent): void => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (window.scrollY === 0 && startY.current > 0) {
        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY.current);
        setPullDistance(Math.min(distance, 100));
      }
    };

    const handleTouchEnd = async (): Promise<void> => {
      if (pullDistance >= 80 && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      startY.current = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  return { isRefreshing, pullDistance };
}
