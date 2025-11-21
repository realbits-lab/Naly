// Feed types and constants based on mobile-ui-ux-specification.md

// 1. Feed limits configuration (like Twitter/X)
export const FEED_LIMITS = {
  MAX_FEED_ITEMS: 50,      // Maximum cards in DOM at any time
  ITEMS_PER_PAGE: 10,      // Cards loaded per fetch
  BUFFER_ITEMS: 20,        // Items kept above/below viewport
  RECYCLE_THRESHOLD: 60,   // Trigger cleanup when exceeding this
} as const;

// 2. Ad configuration for Google AdSense
export const AD_CONFIG = {
  IN_FEED_AD_SLOT: 'ca-pub-XXXXXXX/in-feed',
  DISPLAY_AD_SLOT: 'ca-pub-XXXXXXX/display',
  AD_FORMAT: 'fluid',
  LAYOUT_KEY: '-fb+5w+4e-db+86',
  FIRST_AD_POSITION: 3,    // Show first ad after 3rd card
  AD_INTERVAL: 5,          // Show ad every 5 cards
} as const;

// 3. Content card types
export type TopicCategory = 'stock' | 'coin' | 'sports' | 'politics';

export interface ContentCard {
  id: string;
  title: string;
  summary: string;
  content: string;
  thumbnailUrl?: string;
  category: TopicCategory;
  createdAt: string;
  viewCount: number;
  predictedEngagement: number;
  trends: string[];
  sources: string[];
}

// 4. Feed state
export interface FeedState {
  cards: ContentCard[];
  currentPage: number;
  hasMore: boolean;
  hasRecycledItems: boolean;
  oldestVisibleId: string | null;
  newestVisibleId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

// 5. Feed item types (content or ad)
export type FeedItemType = 'content' | 'ad';

export interface FeedItem {
  type: FeedItemType;
  data: ContentCard | null;
  adSlot?: string;
}

// 6. API response types
export interface FeedResponse {
  items: ContentCard[];
  nextPage: number | null;
  totalCount: number;
  hasMore: boolean;
}

// 7. Utility function to check if ad should be shown at position
export function shouldShowAdAtPosition(position: number): boolean {
  if (position < AD_CONFIG.FIRST_AD_POSITION) return false;

  // Adjust position to account for previously inserted ads
  const contentPosition = position;
  if (contentPosition === AD_CONFIG.FIRST_AD_POSITION) return true;

  const positionAfterFirstAd = contentPosition - AD_CONFIG.FIRST_AD_POSITION;
  return positionAfterFirstAd > 0 && positionAfterFirstAd % AD_CONFIG.AD_INTERVAL === 0;
}

// 8. Generate feed items with ads interspersed
export function generateFeedItemsWithAds(cards: ContentCard[]): FeedItem[] {
  const items: FeedItem[] = [];
  let contentIndex = 0;
  let position = 0;

  for (const card of cards) {
    // Check if we need to insert an ad before this card
    if (shouldShowAdAtPosition(position)) {
      items.push({
        type: 'ad',
        data: null,
        adSlot: AD_CONFIG.IN_FEED_AD_SLOT,
      });
      position++;
    }

    items.push({
      type: 'content',
      data: card,
    });
    position++;
    contentIndex++;
  }

  return items;
}

// 9. Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

// 10. Format view count
export function formatViewCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}

// 11. Category display config
export const CATEGORY_CONFIG: Record<TopicCategory, { icon: string; label: string; color: string }> = {
  stock: { icon: '📈', label: 'Stock', color: 'bg-green-100 text-green-700' },
  coin: { icon: '🪙', label: 'Coin', color: 'bg-yellow-100 text-yellow-700' },
  sports: { icon: '⚽', label: 'Sports', color: 'bg-blue-100 text-blue-700' },
  politics: { icon: '🏛️', label: 'Politics', color: 'bg-purple-100 text-purple-700' },
};
