'use client';

import useSWR from 'swr';
import { ContentCard } from '@/lib/feed/types';
import { getLocalCache, setLocalCache, LOCAL_CACHE_TTL } from '@/lib/local-storage-cache';

/**
 * SWR fetcher for article data with local storage caching
 */
async function articleFetcher(url: string): Promise<ContentCard> {
  // Try local storage cache first
  const cacheKey = url.replace('/api/', '');
  const cached = getLocalCache<ContentCard>(cacheKey, {
    prefix: 'article',
    ttl: LOCAL_CACHE_TTL.LONG, // 2 hours for articles
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
    throw new Error('Failed to fetch article');
  }

  const data = await response.json();

  // Cache in local storage
  setLocalCache(cacheKey, data, {
    prefix: 'article',
    ttl: LOCAL_CACHE_TTL.LONG, // 2 hours
  });

  return data;
}

/**
 * Hook to fetch and cache article data using SWR
 */
export function useArticle(articleId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ContentCard>(
    articleId ? `/api/article/${articleId}` : null,
    articleFetcher,
    {
      revalidateOnFocus: false, // Don't revalidate on window focus
      revalidateOnReconnect: true, // Revalidate on reconnect
      dedupingInterval: 60000, // Dedupe requests within 1 minute
      focusThrottleInterval: 300000, // Throttle focus revalidation to 5 minutes
    }
  );

  return {
    article: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Prefetch an article for performance
 */
export async function prefetchArticle(articleId: string): Promise<void> {
  const url = `/api/article/${articleId}`;
  try {
    await articleFetcher(url);
  } catch (error) {
    console.error('Failed to prefetch article:', error);
  }
}
