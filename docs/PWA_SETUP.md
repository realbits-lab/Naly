# PWA Implementation Guide

## Overview
This project has been configured as a Progressive Web App (PWA) using `@ducanh2912/next-pwa`.

## What's Included

### 1. Web App Manifest
- **Location**: `/public/manifest.json`
- **Purpose**: Defines app metadata for installation
- **Configures**: App name, icons, theme colors, display mode

### 2. Service Worker
- **Auto-generated** by next-pwa during build
- **Location**: `/public/sw.js` (git-ignored, generated at build time)
- **Purpose**: Enables offline functionality and caching

### 3. PWA Icons
- **Location**: `/public/icons/`
- **Current**: Placeholder SVG icons with "N" letter
- **Sizes**: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### 4. Offline Page
- **Location**: `/src/app/offline/page.tsx`
- **Purpose**: User-friendly fallback when offline

## Configuration Files

### next.config.ts
```typescript
import withPWA from "@ducanh2912/next-pwa";

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
```

### Root Layout (src/app/layout.tsx)
Includes PWA metadata:
- Manifest reference
- Theme color
- Apple Web App configuration
- App icons

## Production Setup

### 1. Replace Placeholder Icons
Current icons are simple SVG placeholders. For production:

1. **Generate PNG icons** from your actual app logo
2. **Use a tool** like [RealFaviconGenerator](https://realfavicongenerator.net/)
3. **Replace files** in `/public/icons/` with PNG versions
4. **Update manifest.json** to use `.png` extension instead of `.svg`

Required sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192 (minimum for PWA)
- 384x384
- 512x512 (required for splash screen)

### 2. Customize Manifest
Edit `/public/manifest.json`:
- Update `theme_color` to match your brand
- Update `background_color`
- Customize app `name` and `short_name`
- Add `screenshots` for app stores (optional)

### 3. Test Installation

#### Chrome Desktop:
1. Build production: `npm run build`
2. Start production: `npm start`
3. Open in Chrome
4. Click install icon in address bar

#### Chrome Mobile:
1. Deploy to HTTPS domain (Vercel auto-provides this)
2. Open in Chrome mobile
3. Look for "Add to Home Screen" prompt

#### Safari iOS:
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

## Testing PWA Functionality

### Lighthouse Audit
```bash
# Run Lighthouse PWA audit
npm run build
npm start
# Open Chrome DevTools > Lighthouse > PWA category
```

Target score: ≥ 90

### Offline Testing
1. Build and start production server
2. Open Chrome DevTools
3. Go to Network tab
4. Check "Offline" checkbox
5. Refresh page - should show offline page or cached content

### Service Worker Inspection
1. Chrome DevTools > Application > Service Workers
2. Verify service worker is registered
3. Check Cache Storage for cached resources

## Environment-Specific Behavior

### Development (`npm run dev`)
- PWA is **disabled** by default
- Service worker not registered
- Faster development experience

### Production (`npm run build && npm start`)
- PWA is **enabled**
- Service worker generated and registered
- Full caching and offline support

## Deployment

### Vercel (Recommended)
PWA works automatically on Vercel:
- HTTPS enabled by default ✓
- Service worker served correctly ✓
- Headers configured properly ✓

### Other Platforms
Ensure:
1. **HTTPS** is enabled (required for PWA)
2. **Service worker** files are served with correct headers
3. **Manifest** is accessible at `/manifest.json`

## Caching Strategy

Current configuration uses:
- **Cache-first** for static assets (JS, CSS, images)
- **Network-first** for dynamic content (API calls)
- **Aggressive front-end navigation caching**

To customize caching, edit `next.config.ts`:
```typescript
workboxOptions: {
  runtimeCaching: [
    // Add custom caching strategies
  ],
}
```

## Troubleshooting

### PWA not installing
- ✓ Check HTTPS (required)
- ✓ Verify manifest.json is valid (use Chrome DevTools)
- ✓ Check console for errors
- ✓ Ensure at least 192x192 icon exists

### Service Worker not updating
- Hard refresh (Ctrl+Shift+R)
- Clear service worker in DevTools
- Check "Skip waiting" in Application > Service Workers

### Icons not showing
- Verify icon paths in manifest.json
- Check icon files exist in /public/icons/
- Validate icon format (PNG recommended over SVG)

## Resources

- [Next PWA Documentation](https://github.com/DuCanhGH/next-pwa)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest Spec](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## Next Steps

1. ✅ Basic PWA setup complete
2. ⏳ Replace placeholder icons with actual app icons
3. ⏳ Customize manifest colors and metadata
4. ⏳ Test on multiple devices and browsers
5. ⏳ Run Lighthouse audit
6. ⏳ Add custom caching strategies (optional)
7. ⏳ Implement push notifications (optional)
8. ⏳ Add app shortcuts (optional)
