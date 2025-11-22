# PWA Development Guide

## Overview

This document provides step-by-step implementation instructions for building the PWA functionality in the Naly application.

## Current Implementation Status

The project has been configured as a Progressive Web App (PWA) using `@ducanh2912/next-pwa`.

### What's Included

- ✓ Web App Manifest (`/public/manifest.json`)
- ✓ Service Worker (auto-generated at build time)
- ✓ PWA Icons (placeholder SVG icons)
- ✓ Offline Page (`/src/app/offline/page.tsx`)
- ✓ Next.js PWA configuration
- ✓ Root layout metadata

## Implementation Phases

### Phase 1: Setup

#### 1.1 Install Dependencies

The PWA package is already installed:

```bash
pnpm add @ducanh2912/next-pwa
```

#### 1.2 Generate App Icons

**Required sizes**: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

**Options**:

1. **Use RealFaviconGenerator**: [https://realfavicongenerator.net/](https://realfavicongenerator.net/)
2. **Use PWA Asset Generator**:
   ```bash
   npx pwa-asset-generator [source-image] public/icons
   ```

**Current Status**: Placeholder SVG icons need replacement with PNG versions for production.

#### 1.3 Create Manifest File

**Location**: `/public/manifest.json`

**Current Configuration**:
```json
{
  "name": "Naly",
  "short_name": "Naly",
  "description": "Your app description",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [...]
}
```

**Customization Steps**:
1. Update `theme_color` to match your brand
2. Update `background_color`
3. Customize app `name` and `short_name`
4. Add `screenshots` for app stores (optional)

### Phase 2: Service Worker Configuration

#### 2.1 Next.js Configuration

**Location**: `next.config.ts`

**Current Configuration**:

```typescript
import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  // Your existing Next.js config
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
```

**Configuration Options**:

- `dest`: Output directory for service worker files
- `cacheOnFrontEndNav`: Enable caching for client-side navigation
- `aggressiveFrontEndNavCaching`: Aggressive caching for better performance
- `reloadOnOnline`: Reload page when coming back online
- `disable`: Disable PWA in development mode

#### 2.2 Custom Caching Strategies

To add custom caching rules, extend the configuration:

```typescript
export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.example\.com\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
})(nextConfig);
```

**Caching Strategies**:

- **CacheFirst**: Serve from cache, fallback to network
- **NetworkFirst**: Try network first, fallback to cache
- **StaleWhileRevalidate**: Serve from cache while updating in background
- **NetworkOnly**: Always fetch from network
- **CacheOnly**: Only serve from cache

### Phase 3: Integration

#### 3.1 Update Root Layout

**Location**: `src/app/layout.tsx`

**Add PWA Metadata**:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  // Existing metadata...
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Naly',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
};
```

#### 3.2 Create Offline Fallback Page

**Location**: `/src/app/offline/page.tsx`

**Example Implementation**:

```tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
        <p className="text-gray-600 mb-4">
          It looks like you've lost your internet connection.
        </p>
        <p className="text-gray-500">
          Don't worry, you can still browse cached content.
        </p>
      </div>
    </div>
  );
}
```

#### 3.3 Add PWA Meta Tags (Optional)

Add additional meta tags in layout if needed:

```tsx
<head>
  <meta name="application-name" content="Naly" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Naly" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
</head>
```

### Phase 4: Production Setup

#### 4.1 Replace Placeholder Icons

1. Generate PNG icons from your app logo
2. Use recommended tools (see Phase 1.2)
3. Replace files in `/public/icons/`
4. Update `manifest.json` to use `.png` extension

#### 4.2 Update Manifest Colors

Edit `/public/manifest.json`:

```json
{
  "theme_color": "#your-brand-color",
  "background_color": "#your-background-color"
}
```

#### 4.3 Add App Screenshots (Optional)

For better app store presentation:

```json
{
  "screenshots": [
    {
      "src": "/screenshots/screenshot-1.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ]
}
```

### Phase 5: Optimization

#### 5.1 Optimize Service Worker Size

- Minimize unnecessary runtime caching rules
- Use precise URL patterns
- Set appropriate cache expiration

#### 5.2 Fine-tune Cache Strategies

- Analyze which resources need aggressive caching
- Adjust expiration times based on update frequency
- Consider network conditions

#### 5.3 Add Skip Waiting Logic

Enable immediate service worker updates:

```typescript
workboxOptions: {
  skipWaiting: true,
  clientsClaim: true,
}
```

#### 5.4 Implement Update Notification UI

Create a component to notify users of updates:

```tsx
'use client';

import { useEffect, useState } from 'react';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdate(true);
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
      <p className="mb-2">A new version is available!</p>
      <button
        onClick={handleUpdate}
        className="bg-white text-blue-500 px-4 py-2 rounded"
      >
        Update Now
      </button>
    </div>
  );
}
```

## Environment-Specific Behavior

### Development Mode (`npm run dev`)

- PWA is **disabled** by default
- Service worker not registered
- Faster development experience
- No caching applied

**Why disabled?** Prevents caching issues during development.

### Production Mode (`npm run build && npm start`)

- PWA is **enabled**
- Service worker generated and registered
- Full caching and offline support
- All PWA features active

## Deployment

### Vercel (Current Platform)

PWA works automatically on Vercel:
- ✓ HTTPS enabled by default
- ✓ Service worker served correctly
- ✓ Headers configured properly

**No additional configuration needed.**

### Other Platforms

If deploying to other platforms, ensure:

1. **HTTPS is enabled** (required for PWA)
2. **Service worker files** are served with correct headers:
   ```
   Service-Worker-Allowed: /
   ```
3. **Manifest is accessible** at `/manifest.json`
4. **Static files** are properly served from `/public`

### Build Process

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start production server (for testing)
pnpm start
```

**Generated Files** (git-ignored):
- `/public/sw.js` - Service worker
- `/public/workbox-*.js` - Workbox runtime
- `/public/sw.js.map` - Source map

## Caching Strategy Details

### Current Configuration

```typescript
{
  cacheOnFrontEndNav: true,           // Cache during navigation
  aggressiveFrontEndNavCaching: true, // Aggressive caching
  reloadOnOnline: true,               // Reload when back online
}
```

### What Gets Cached

**Automatically Cached**:
- Static assets (JS, CSS)
- Images
- Fonts
- Navigation routes

**Not Cached by Default**:
- API responses (unless configured)
- Dynamic content
- External resources

### Cache Invalidation

Service worker caches are versioned and automatically updated when:
- New deployment occurs
- Service worker file changes
- Cache version is updated

## Advanced Features (Optional)

### Push Notifications

```typescript
// Add to workboxOptions
workboxOptions: {
  // ... other options
  additionalManifestEntries: [
    { url: '/offline', revision: null },
  ],
}
```

### App Shortcuts

Add to `manifest.json`:

```json
{
  "shortcuts": [
    {
      "name": "Open Dashboard",
      "short_name": "Dashboard",
      "description": "Go to dashboard",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/shortcut-dashboard.png", "sizes": "192x192" }]
    }
  ]
}
```

### Share Target API

Allow app to receive shared content:

```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

## Next Steps

1. ✅ Basic PWA setup complete
2. ⏳ Replace placeholder icons with actual app icons
3. ⏳ Customize manifest colors and metadata
4. ⏳ Test on multiple devices and browsers
5. ⏳ Run Lighthouse audit (see pwa-testing.md)
6. ⏳ Add custom caching strategies (if needed)
7. ⏳ Implement push notifications (optional)
8. ⏳ Add app shortcuts (optional)

## Resources

- [Next PWA Documentation](https://github.com/DuCanhGH/next-pwa)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Icon Generator Tools](https://realfavicongenerator.net/)

## Common Development Tasks

### Update Service Worker

1. Modify `next.config.ts`
2. Run `pnpm build`
3. Service worker regenerated automatically

### Change Caching Strategy

1. Edit `workboxOptions.runtimeCaching` in `next.config.ts`
2. Rebuild application
3. Test with Chrome DevTools

### Add New Icon Size

1. Generate icon in required size
2. Add to `/public/icons/`
3. Update `manifest.json` icons array
4. Rebuild and test

### Debug Service Worker Issues

1. Open Chrome DevTools
2. Go to Application > Service Workers
3. Check registration status
4. Use "Update" and "Unregister" for testing
