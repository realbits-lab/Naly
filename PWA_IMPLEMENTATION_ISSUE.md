# Implement Progressive Web App (PWA) Functionality

## Overview
Add PWA capabilities to the Naly application to provide native app-like experience, offline functionality, and installability across devices.

## Background
Progressive Web Apps combine the best of web and native apps, offering:
- **Installability**: Users can add the app to their home screen
- **Offline Support**: App continues to function without network connectivity
- **Performance**: Faster load times through intelligent caching
- **Engagement**: Push notifications and app-like experience
- **Cross-Platform**: Single codebase works across all devices

## Technical Requirements

### 1. Web App Manifest
Create a manifest file (`/public/manifest.json`) with the following configuration:

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
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 2. Service Worker Implementation
Implement a service worker to handle:
- **Caching Strategy**: Cache-first for static assets, network-first for dynamic content
- **Offline Fallback**: Show offline page when network is unavailable
- **Background Sync**: Queue failed requests for retry when connection restored
- **Cache Management**: Clean up old caches on updates

### 3. Next.js Configuration
For Next.js 16, consider using one of these approaches:

**Option A: Manual Implementation**
- Create custom service worker in `/public/sw.js`
- Register service worker in root layout
- Add manifest link to metadata

**Option B: Use Next.js PWA Plugin**
- Install `@ducanh2912/next-pwa` (compatible with Next.js 14+)
- Configure in `next.config.js`

### 4. PWA Metadata
Update `src/app/layout.tsx` to include PWA metadata:

```tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Naly',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};
```

### 5. App Icons
Generate and add PWA icons to `/public/icons/`:
- Multiple sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Both regular and maskable versions
- Apple touch icons for iOS

### 6. Offline Experience
Implement offline fallback page:
- Create `/src/app/offline/page.tsx`
- Design user-friendly offline notification
- Cache offline page for immediate availability

## Implementation Steps

1. **Setup Phase**
   - [ ] Research and choose implementation approach (manual vs. plugin)
   - [ ] Generate app icons in required sizes
   - [ ] Create manifest.json file

2. **Service Worker Phase**
   - [ ] Implement service worker with caching strategies
   - [ ] Add offline detection and fallback
   - [ ] Implement cache versioning and cleanup
   - [ ] Add service worker registration logic

3. **Integration Phase**
   - [ ] Update Next.js metadata configuration
   - [ ] Add PWA meta tags to root layout
   - [ ] Create offline fallback page
   - [ ] Test manifest validation

4. **Testing Phase**
   - [ ] Test installation flow on Chrome (desktop & mobile)
   - [ ] Test installation on Safari iOS
   - [ ] Test offline functionality
   - [ ] Validate with Lighthouse PWA audit
   - [ ] Test cache strategies and updates

5. **Optimization Phase**
   - [ ] Optimize service worker size
   - [ ] Fine-tune cache strategies
   - [ ] Add skip waiting logic for updates
   - [ ] Implement update notification UI

## Best Practices for 2025

1. **Security**: Ensure all resources are served over HTTPS (required for PWAs)
2. **Performance**: Optimize Core Web Vitals (LCP, FID, CLS)
3. **Responsive**: Ensure app works on all screen sizes
4. **Accessibility**: Maintain WCAG compliance
5. **Updates**: Implement smooth update mechanism without disrupting user experience

## Testing Checklist

- [ ] PWA installable on Chrome desktop
- [ ] PWA installable on Chrome Android
- [ ] PWA installable on Safari iOS
- [ ] Offline mode works correctly
- [ ] App updates properly when new version deployed
- [ ] Lighthouse PWA score > 90
- [ ] All icons display correctly
- [ ] Splash screen appears on launch
- [ ] Theme color applies correctly
- [ ] App shortcuts work (if implemented)

## References

- [MDN Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [MDN PWA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [Next.js PWA Plugin](https://github.com/DuCanhGH/next-pwa)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)

## Success Criteria

- Application is installable on major browsers and platforms
- Lighthouse PWA audit score ≥ 90
- App functions offline with meaningful fallback
- Service worker successfully caches and serves resources
- Users can install app from browser with custom install prompt

## Technical Stack

- **Framework**: Next.js 16.0.3
- **Current Setup**: App Router architecture
- **Deployment**: Vercel (HTTPS ✓)

## Priority

**Medium-High** - PWAs are standard in 2025 and significantly improve user experience and engagement metrics.
