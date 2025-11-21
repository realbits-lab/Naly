# Mobile UI/UX Specification

## Overview

This document defines the UI/UX specifications for Naly's mobile-first, guest-friendly content consumption experience. The design prioritizes thumb-friendly interactions, infinite scroll patterns, and a card-based content architecture inspired by leading social media platforms.

## Design Principles

### 1. Mobile-First Philosophy

- **Primary target**: Mobile devices (viewport < 768px)
- **Authentication**: Non-login users (guest experience first)
- **Interaction model**: One-thumb operation optimized
- **Content consumption**: Passive scrolling with minimal cognitive load

### 2. Core UX Patterns

| Pattern | Inspiration | Purpose |
|---------|-------------|---------|
| Bounded Infinite Scroll | Twitter/X, Instagram | Continuous content discovery with memory limits |
| Card UI | Pinterest, LinkedIn | Scannable content chunks |
| Scroll-to-top FAB | Twitter/X, Reddit | Quick return to top |
| Pull-to-Refresh | Universal mobile | Fresh content loading |

### 3. Feed Item Limits (Like Twitter/X)

Twitter/X and other social media apps do not truly implement infinite scrolling. They limit the number of items in memory to prevent performance degradation.

**Maximum Item Configuration**:
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `MAX_FEED_ITEMS` | 50 | Maximum cards in DOM at any time |
| `ITEMS_PER_PAGE` | 10 | Cards loaded per fetch |
| `BUFFER_ITEMS` | 20 | Items kept above/below viewport |
| `RECYCLE_THRESHOLD` | 60 | Trigger cleanup when exceeding this |

**Behavior When Limit Reached**:
```
User scrolls down past 50 items:
├── Remove oldest 10 items from top of list
├── Keep scroll position visually stable
├── Show "Scroll to top" FAB button
└── Allow continued downward scrolling

User scrolls back up to removed items:
├── Show "Load newer posts" button
├── Or auto-fetch when reaching top boundary
└── Remove items from bottom to maintain limit
```

**Memory Management Strategy**:
```
┌─────────────────────────────────────┐
│  [Removed - fetch on scroll up]     │  ← Items 1-10 (recycled)
├─────────────────────────────────────┤
│  Buffer Zone (20 items)             │  ← Items 11-30
├─────────────────────────────────────┤
│  ████ VISIBLE VIEWPORT ████         │  ← Items 31-35 (on screen)
├─────────────────────────────────────┤
│  Buffer Zone (20 items)             │  ← Items 36-55
├─────────────────────────────────────┤
│  [Not yet loaded]                   │  ← Items 56+ (fetch on scroll)
└─────────────────────────────────────┘
```

**End of Feed Behavior**:
- Show "You're all caught up" message after `MAX_FEED_ITEMS`
- Provide "Load more" button for explicit continuation
- Display timestamp of oldest visible item

### 4. Native Ad Integration (Google AdSense)

Ads are displayed as native in-feed cards that match the content card design, providing a non-disruptive user experience.

**Ad Placement Strategy**:
| Position | Type | Frequency |
|----------|------|-----------|
| After card 3 | In-feed native ad | First ad |
| Every 5 cards | In-feed native ad | Recurring |
| End of feed | Display ad | Once per session |

**Ad Card Design** (Matches Content Card):
```
┌─────────────────────────────────┐
│  Ad Image (16:9 ratio)          │  ← Same dimensions as content
│  Height: 140px                   │
├─────────────────────────────────┤
│  Ad  │  Sponsored               │  ← "Ad" badge + "Sponsored" label
├─────────────────────────────────┤
│  Ad Headline (2 lines max)      │  ← Same typography as content title
├─────────────────────────────────┤
│  Ad Description (2 lines)       │  ← Same style as content summary
├─────────────────────────────────┤
│  Advertiser Name  │  CTA Button │  ← Call-to-action
└─────────────────────────────────┘
```

**Google AdSense Configuration**:
```typescript
// Ad unit types for feed
const AD_CONFIG = {
  IN_FEED_AD_SLOT: 'ca-pub-XXXXXXX/in-feed',
  DISPLAY_AD_SLOT: 'ca-pub-XXXXXXX/display',
  AD_FORMAT: 'fluid',              // Responsive native ad
  LAYOUT_KEY: '-fb+5w+4e-db+86',   // In-feed layout
  FIRST_AD_POSITION: 3,            // Show first ad after 3rd card
  AD_INTERVAL: 5,                  // Show ad every 5 cards
} as const;
```

**Ad Card Component**:
```typescript
interface AdCardProps {
  slot: string;
  format: 'fluid' | 'rectangle';
  layoutKey?: string;
}

// Styling to match content cards
const adCardStyles = {
  container: "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
  badge: "text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded",
  sponsored: "text-xs text-gray-400",
};
```

**Feed with Ads Layout**:
```
┌─────────────────────────────────┐
│  Content Card 1                 │
├─────────────────────────────────┤
│  Content Card 2                 │
├─────────────────────────────────┤
│  Content Card 3                 │
├─────────────────────────────────┤
│  ▓▓▓ AD CARD (Native) ▓▓▓      │  ← First ad (position 3)
│  Ad  │  Sponsored               │
├─────────────────────────────────┤
│  Content Card 4                 │
├─────────────────────────────────┤
│  Content Card 5                 │
├─────────────────────────────────┤
│  Content Card 6                 │
├─────────────────────────────────┤
│  Content Card 7                 │
├─────────────────────────────────┤
│  Content Card 8                 │
├─────────────────────────────────┤
│  ▓▓▓ AD CARD (Native) ▓▓▓      │  ← Second ad (position 8)
│  Ad  │  Sponsored               │
├─────────────────────────────────┤
│  Content Card 9                 │
│           ...                   │
└─────────────────────────────────┘
```

**Ad Disclosure Requirements**:
- Clear "Ad" badge (top-left, gray background)
- "Sponsored" text label
- Visually distinct but not jarring
- Compliant with Google AdSense policies

**Performance Considerations**:
- Lazy load ad units (only when near viewport)
- Use `loading="lazy"` on ad iframes
- Ads don't count toward `MAX_FEED_ITEMS` limit
- Placeholder skeleton while ad loads

## Screen Architecture

### Landing Page (Feed View)

```
┌─────────────────────────────┐
│  ┌─────────────────────┐    │  ← Status Bar (system)
│  │    NALY             │    │  ← Header (collapsible on scroll)
│  └─────────────────────┘    │
│                             │
│  ┌───────────────────────┐  │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  │  ← Content Card 1 (AI recommended)
│  │  📰 Catchy Title      │  │
│  │  Summary text that    │  │
│  │  hooks the reader...  │  │
│  │  🕐 2h ago  👁 1.2k    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  │  ← Content Card 2 (AI recommended)
│  │  📰 Another Title     │  │
│  │  Engaging summary...  │  │
│  │  🕐 4h ago  👁 856     │  │
│  └───────────────────────┘  │
│           ...               │  ← AI curated feed continues
│  ┌───────────────────────┐  │
│  │    Loading Spinner    │  │  ← Loading indicator
│  └───────────────────────┘  │
│                             │
│        ┌─────┐              │
│        │  ↑  │              │  ← "Scroll to top" FAB (appears on scroll)
│        └─────┘              │
└─────────────────────────────┘
```

> **Note**: No topic filters or bottom navigation. AI intelligently curates content. Single-screen feed experience with minimal UI.

### Detail Page (Article View)

```
┌─────────────────────────────┐
│  ┌─────────────────────┐    │
│  │ ← Back    Share 📤  │    │  ← Header with actions
│  └─────────────────────┘    │
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  │  ← Hero Image/Visual
│  │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  Full Article Title Here    │  ← Title (H1)
│                             │
│  🕐 2 hours ago │ 📊 Stock  │  ← Metadata row
│                             │
│  ─────────────────────────  │
│                             │
│  Full article content with  │  ← Content body
│  multiple paragraphs and    │
│  rich formatting...         │
│                             │
│  • Trend insight 1          │  ← Trend tags
│  • Trend insight 2          │
│                             │
│  Sources: [1] [2] [3]       │  ← Source links
│                             │
│  ─────────────────────────  │
│                             │
│  Related Articles           │  ← Related content section
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ 📰  │ │ 📰  │ │ 📰  │   │  ← Horizontal scroll cards
│  └─────┘ └─────┘ └─────┘   │
│                             │
└─────────────────────────────┘
```

## Component Specifications

### 1. Content Card Component

**Purpose**: Primary content preview unit on the feed

**Dimensions**:
- Width: 100% - 32px (16px margin each side)
- Min height: 200px
- Max height: 320px
- Border radius: 12px
- Margin bottom: 16px

**Structure**:
```
┌─────────────────────────────────┐
│  Thumbnail Image (optional)      │  ← 16:9 ratio, lazy loaded
│  Height: 140px                   │
├─────────────────────────────────┤
│  Category Badge    │  Time ago   │  ← 12px font, muted color
├─────────────────────────────────┤
│  Title (2 lines max)             │  ← 18px font, bold, line-clamp-2
├─────────────────────────────────┤
│  Summary (3 lines max)           │  ← 14px font, line-clamp-3
├─────────────────────────────────┤
│  👁 Views  │  📊 Predicted %     │  ← 12px font, icon + number
└─────────────────────────────────┘
```

**States**:
- Default: White background, subtle shadow
- Pressed: Scale(0.98), darker shadow
- Loading: Skeleton placeholder

**Tailwind Classes**:
```css
card: "bg-white rounded-xl shadow-sm border border-gray-100
       overflow-hidden active:scale-[0.98] transition-transform"
```

### 2. AI-Curated Feed (No Manual Filters)

**Purpose**: Intelligent content recommendation without user intervention

**How It Works**:
- AI analyzes trending topics across all categories (Stock, Coin, Sports, Politics)
- Content is ranked by relevance, freshness, and predicted engagement
- Feed is automatically diversified to prevent content fatigue
- No manual topic filtering required from users

**Content Selection Signals**:
| Signal | Weight | Description |
|--------|--------|-------------|
| Trending score | High | Current hot topics across sources |
| Freshness | High | Recency of the content |
| Predicted engagement | Medium | AI-predicted click/read rate |
| Topic diversity | Medium | Balanced mix of categories |
| Content quality | Medium | Editorial quality score |

**Benefits**:
- Reduced cognitive load (no filter decisions)
- Serendipitous discovery of diverse content
- Simpler UI with more screen real estate for content
- AI handles personalization automatically

### 3. Minimal Navigation

> **Note**: No bottom navigation bar. The app focuses on a single-screen feed experience with minimal UI chrome.

**Navigation Elements**:
- Header with app logo (collapsible on scroll)
- "Scroll to top" FAB when scrolled down
- Back button on detail pages only

**Benefits**:
- Maximum content area
- Distraction-free reading
- Simpler architecture for MVP

### 4. Header Component

**Collapsible Header Behavior**:
- Full height: 56px
- Collapsed: 0px (hidden)
- Trigger: 50px scroll threshold
- Animation: 200ms ease-out

### 5. Loading States

**Skeleton Card**:
```
┌─────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Animated gradient
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────────────┤
│  ░░░░░░░░░░       ░░░░░        │
├─────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░       │
│  ░░░░░░░░░░░░░░░░░             │
├─────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────┘
```

**Infinite Scroll Loader**:
- Position: Center, 48px from bottom
- Style: Spinner with brand color
- Text: "Loading more..."

## Interaction Patterns

### 1. Thumb Zone Optimization

```
┌─────────────────────────────┐
│                             │
│      HARD TO REACH          │  ← Avoid critical actions here
│                             │
├─────────────────────────────┤
│                             │
│      COMFORTABLE            │  ← Primary content area
│                             │
├─────────────────────────────┤
│                             │
│      NATURAL THUMB          │  ← Navigation, primary actions
│           ZONE              │
└─────────────────────────────┘
```

**Design Rules**:
- Navigation: Bottom 20% of screen
- Primary CTAs: Lower half of screen
- Destructive actions: Require confirmation
- Scrolling: Full screen gesture area

### 2. Gesture Support

| Gesture | Action | Screen |
|---------|--------|--------|
| Swipe Up | Load more content | Feed |
| Swipe Down | Pull-to-refresh | Feed |
| Swipe Left | Next article | Detail |
| Swipe Right | Back to feed | Detail |
| Tap | Open detail | Card |
| Long Press | Share menu | Card |

### 3. Scroll Behavior

**Infinite Scroll Implementation**:
```
1. User scrolls to 80% of loaded content
2. Trigger: Fetch next page (10 items)
3. Show inline loading spinner
4. Append new cards with fade-in animation
5. Maintain scroll position
```

**Pull-to-Refresh**:
```
1. Pull threshold: 80px
2. Visual feedback: Spinner + "Refreshing..."
3. Release: Fetch fresh content
4. Complete: Bounce animation, update timestamp
```

### 4. Transitions

**Card to Detail**:
- Type: Shared element transition
- Duration: 300ms
- Easing: ease-in-out
- Elements: Card image expands to hero image

**Navigation**:
- Page push: Slide from right (300ms)
- Page pop: Slide to right (300ms)
- Modal: Slide from bottom (250ms)

## Visual Design System

### Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Article title) | 24px | Bold | 1.3 |
| H2 (Section) | 20px | Semibold | 1.4 |
| Card Title | 18px | Semibold | 1.3 |
| Body | 16px | Regular | 1.6 |
| Caption | 14px | Regular | 1.4 |
| Meta | 12px | Regular | 1.4 |

### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--bg-primary` | #FFFFFF | #0F0F0F | Main background |
| `--bg-secondary` | #F5F5F5 | #1A1A1A | Card background |
| `--text-primary` | #111111 | #F5F5F5 | Headlines |
| `--text-secondary` | #666666 | #A0A0A0 | Body text |
| `--text-muted` | #999999 | #666666 | Meta text |
| `--accent` | #2563EB | #3B82F6 | Links, CTAs |
| `--border` | #E5E5E5 | #2A2A2A | Card borders |

### Spacing Scale

```
4px  - xs  (micro spacing)
8px  - sm  (tight)
12px - md  (default)
16px - lg  (comfortable)
24px - xl  (section gap)
32px - 2xl (major sections)
```

### Shadows

```css
shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
shadow-card-hover: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
shadow-nav: 0 -1px 3px rgba(0,0,0,0.06);
```

## Performance Guidelines

### 1. Image Optimization

- Format: WebP with JPEG fallback
- Thumbnail: 400px width, 60% quality
- Hero: 800px width, 75% quality
- Lazy loading: Below-fold images
- Placeholder: Blur-up technique

### 2. Content Loading Strategy (Bounded Scroll)

```
Initial Load:
├── First 5 cards (immediate)
├── Skeleton for cards 6-10
└── Lazy load images below fold

Scroll Load (Bounded):
├── Trigger at 80% scroll depth
├── Fetch 10 cards per batch (ITEMS_PER_PAGE)
├── MAX_FEED_ITEMS: 50 cards in DOM
├── When exceeding limit: recycle oldest items
└── Show "You're all caught up" at boundary

Scroll Up (After Recycling):
├── Detect scroll to top boundary
├── Show "Load newer posts" prompt
├── Fetch recycled items on demand
└── Remove items from bottom to maintain limit
```

### 3. Caching Strategy

| Content | Cache Duration | Strategy |
|---------|----------------|----------|
| Static assets | 1 year | Immutable |
| Feed data | 5 minutes | Stale-while-revalidate |
| Article content | 30 minutes | Cache-first |
| Images | 24 hours | Cache-first |

## Accessibility Requirements

### Touch Targets
- Minimum: 44px x 44px
- Recommended: 48px x 48px
- Spacing between targets: 8px minimum

### Focus States
- Visible focus ring on all interactive elements
- Focus order follows visual layout
- Skip navigation link for keyboard users

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for icons-only buttons
- Live regions for dynamic content updates
- Alt text for all images

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## User Flow Diagrams

### Primary Flow: Content Discovery

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  App    │───▶│  Feed   │───▶│  Card   │───▶│ Detail  │
│  Open   │    │  View   │    │  Tap    │    │  View   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │              │              │
                    │              │              │
                    ▼              ▼              ▼
              ┌─────────┐    ┌─────────┐
              │ Scroll  │    │  Share  │
              │  Feed   │    │ Article │
              └─────────┘    └─────────┘
```

> **Note**: No manual topic filtering flow. AI automatically curates diverse, relevant content for all users.

## Implementation Checklist

### Phase 1: Core Feed Experience
- [ ] Implement card component with responsive design
- [ ] Set up infinite scroll with virtualization
- [ ] Add pull-to-refresh functionality
- [ ] Create skeleton loading states
- [ ] Implement AI-curated feed logic

### Phase 2: Detail View
- [ ] Build article detail page
- [ ] Add shared element transitions
- [ ] Implement swipe gestures
- [ ] Add related content section

### Phase 3: Navigation & Polish
- [ ] Build collapsible header
- [ ] Implement scroll-to-top FAB
- [ ] Add haptic feedback
- [ ] Dark mode support
- [ ] Performance optimization

### Phase 4: Accessibility & Testing
- [ ] Screen reader testing
- [ ] Keyboard navigation
- [ ] Color contrast audit
- [ ] Performance benchmarking

## Technical Notes

### Recommended Libraries

| Feature | Library | Reason |
|---------|---------|--------|
| Infinite Scroll | `@tanstack/react-virtual` | Performance virtualization |
| Gestures | `framer-motion` | Smooth animations |
| Pull-to-Refresh | `react-pull-to-refresh` | Native-like UX |
| Images | `next/image` | Built-in optimization |

### State Management

```typescript
// Feed constants
const FEED_LIMITS = {
  MAX_FEED_ITEMS: 50,      // Maximum cards in DOM
  ITEMS_PER_PAGE: 10,      // Cards per fetch
  BUFFER_ITEMS: 20,        // Items above/below viewport
  RECYCLE_THRESHOLD: 60,   // Trigger cleanup threshold
} as const;

interface FeedState {
  cards: ContentCard[];
  currentPage: number;
  hasMore: boolean;
  hasRecycledItems: boolean;  // True if older items were removed
  oldestVisibleId: string | null;  // For "Load newer" functionality
  newestVisibleId: string | null;
  isLoading: boolean;
  // No activeFilter - AI curates content automatically
  error: string | null;
}
```

### API Integration

```typescript
// Fetch feed with pagination
GET /api/feed?page={page}&limit=10&topic={topic}

// Response
{
  items: ContentCard[],
  nextPage: number | null,
  totalCount: number
}
```

---

*Last updated: 2025-11-21*
*Version: 1.0.0*
