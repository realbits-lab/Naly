# PWA Testing Guide

## Overview

This document provides comprehensive testing procedures, checklists, and troubleshooting steps for the Naly PWA implementation.

## Prerequisites

Before testing, ensure:
- ✓ Application built for production (`pnpm build`)
- ✓ Production server running (`pnpm start`) or deployed to Vercel
- ✓ HTTPS enabled (required for PWA features)

## Testing Procedures

### 1. Lighthouse PWA Audit

**Goal**: Achieve score ≥ 90

#### Chrome Desktop Testing

```bash
# Build and start production server
pnpm build
pnpm start
```

**Steps**:
1. Open application in Chrome
2. Open Chrome DevTools (F12)
3. Navigate to **Lighthouse** tab
4. Select **Progressive Web App** category
5. Click **Analyze page load**
6. Review results and fix any issues

**Target Metrics**:
- PWA Score: ≥ 90
- Installable: ✓
- PWA Optimized: ✓
- All checks passing

#### Mobile Testing

1. Deploy to production (Vercel)
2. Open in Chrome on mobile device
3. Use Chrome Remote Debugging
4. Run Lighthouse audit from desktop DevTools

### 2. Installation Flow Testing

#### Chrome Desktop Installation

**Steps**:
1. Build and start production server
2. Open in Chrome
3. Look for install icon in address bar (⊕ or computer icon)
4. Click install icon
5. Confirm installation dialog
6. Verify app opens in standalone window
7. Check app appears in:
   - Chrome Apps (`chrome://apps`)
   - Start Menu / Applications folder

**Expected Behavior**:
- Install prompt appears
- App opens in new window (no browser UI)
- Theme color applied to window
- Icon shows in taskbar/dock

#### Chrome Android Installation

**Steps**:
1. Deploy to HTTPS domain (Vercel)
2. Open in Chrome mobile
3. Wait for "Add to Home Screen" prompt (or tap menu > "Add to Home Screen")
4. Confirm installation
5. Verify app icon on home screen
6. Open app from home screen
7. Check standalone mode (no browser UI)

**Expected Behavior**:
- Installation prompt appears
- App icon added to home screen
- Splash screen shows on launch
- Runs in standalone mode
- Theme color applied to status bar

#### Safari iOS Installation

**Steps**:
1. Open in Safari on iOS
2. Tap **Share** button (square with arrow)
3. Scroll and select **"Add to Home Screen"**
4. Customize name if desired
5. Tap **Add**
6. Verify app icon on home screen
7. Open app from home screen

**Expected Behavior**:
- App icon appears on home screen
- Apple touch icon used
- Splash screen generated from icon
- Runs in standalone mode

### 3. Offline Functionality Testing

#### Basic Offline Test

**Steps**:
1. Build and start production server
2. Open application in Chrome
3. Navigate through several pages
4. Open Chrome DevTools
5. Go to **Network** tab
6. Check **Offline** checkbox
7. Refresh page or navigate to other pages
8. Verify offline page or cached content shows

**Expected Behavior**:
- Previously visited pages load from cache
- Offline page shows for uncached routes
- No network errors visible to user

#### Advanced Offline Scenarios

**Test 1: Fresh Installation Offline**
1. Install PWA
2. Close app
3. Enable offline mode
4. Open app
5. Verify start page loads

**Test 2: Intermittent Connectivity**
1. Open app online
2. Toggle offline/online multiple times
3. Verify app handles transitions gracefully
4. Check `reloadOnOnline` behavior

**Test 3: Background Sync**
1. Create action while offline (if implemented)
2. Go back online
3. Verify action completes automatically

### 4. Service Worker Inspection

#### Chrome DevTools

**Location**: DevTools > Application > Service Workers

**Checks**:
1. Service worker status: **activated and running**
2. Source: `sw.js`
3. No errors in console
4. Update on reload option available

**Actions to Test**:
- **Update**: Force service worker update
- **Unregister**: Remove service worker (for debugging)
- **Skip waiting**: Apply updates immediately

#### Cache Storage Inspection

**Location**: DevTools > Application > Cache Storage

**Checks**:
1. Verify caches exist:
   - `workbox-precache-v2-[url]`
   - `workbox-runtime-[cacheName]`
2. Inspect cached resources
3. Verify expected files are cached
4. Check cache sizes

**Expected Caches**:
- Static assets (JS, CSS)
- Images
- Fonts
- Navigation routes
- API responses (if configured)

### 5. Manifest Validation

#### Chrome DevTools

**Location**: DevTools > Application > Manifest

**Checks**:
- ✓ Manifest URL loads correctly
- ✓ All properties parsed correctly
- ✓ Icons show in preview
- ✓ No errors or warnings
- ✓ Name and short name correct
- ✓ Theme color and background color correct
- ✓ Start URL correct
- ✓ Display mode is "standalone"

#### Manual Validation

```bash
# Fetch manifest
curl https://your-app.vercel.app/manifest.json

# Validate JSON
npx jsonlint manifest.json
```

**Online Validators**:
- [Web Manifest Validator](https://manifest-validator.appspot.com/)
- [PWA Builder Validator](https://www.pwabuilder.com/)

### 6. Platform-Specific Testing

#### Desktop Browsers

| Browser | Version | Install | Offline | Notes |
|---------|---------|---------|---------|-------|
| Chrome | Latest | ✓ | ✓ | Full support |
| Edge | Latest | ✓ | ✓ | Chromium-based |
| Firefox | Latest | Partial | ✓ | No install prompt |
| Safari | Latest | No | ✓ | No install support |

#### Mobile Browsers

| Browser | Platform | Install | Offline | Notes |
|---------|----------|---------|---------|-------|
| Chrome | Android | ✓ | ✓ | Full support |
| Samsung Internet | Android | ✓ | ✓ | Full support |
| Safari | iOS | ✓ | ✓ | Add to Home Screen |
| Firefox | Android | Partial | ✓ | Limited support |

### 7. Performance Testing

#### Core Web Vitals

**Metrics to Track**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

**Testing Tools**:
- Chrome DevTools > Lighthouse
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Web Vitals Extension](https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma)

#### Load Time Testing

**Scenarios**:
1. **First Load** (no cache)
   - Target: < 3s on 3G
2. **Return Visit** (with cache)
   - Target: < 1s
3. **Offline Load**
   - Target: < 0.5s

## Comprehensive Testing Checklist

### Installation Testing

- [ ] PWA installable on Chrome desktop
- [ ] PWA installable on Chrome Android
- [ ] PWA installable on Safari iOS (Add to Home Screen)
- [ ] Install icon appears in browser
- [ ] Installation prompt works correctly
- [ ] App appears in OS app list after install
- [ ] App opens in standalone mode (no browser UI)
- [ ] Splash screen appears on launch
- [ ] App icon displays correctly on home screen

### Visual Testing

- [ ] All icons display correctly (72x72 through 512x512)
- [ ] Theme color applies correctly to browser/OS
- [ ] Background color shows during splash screen
- [ ] Apple touch icons work on iOS
- [ ] Maskable icons work correctly
- [ ] App name displays correctly

### Functionality Testing

- [ ] Offline mode works correctly
- [ ] Cached pages load when offline
- [ ] Offline fallback page displays for uncached routes
- [ ] App reloads when coming back online
- [ ] Service worker updates properly
- [ ] Cache invalidation works on update

### Performance Testing

- [ ] Lighthouse PWA score > 90
- [ ] Core Web Vitals all green
- [ ] First load < 3s on 3G
- [ ] Cached load < 1s
- [ ] No console errors
- [ ] No service worker errors

### Cross-Platform Testing

- [ ] Works on Chrome desktop
- [ ] Works on Edge desktop
- [ ] Works on Chrome Android
- [ ] Works on Safari iOS
- [ ] Works on Samsung Internet
- [ ] Responsive on all screen sizes
- [ ] Portrait and landscape modes work

### Security Testing

- [ ] All resources served over HTTPS
- [ ] No mixed content warnings
- [ ] Service worker scope correct
- [ ] Manifest served with correct MIME type
- [ ] No security warnings in DevTools

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] WCAG 2.1 AA compliant
- [ ] Focus indicators visible
- [ ] Proper ARIA labels

## Troubleshooting Guide

### PWA Not Installing

**Issue**: Install icon doesn't appear in browser

**Solutions**:
1. ✓ Verify HTTPS is enabled (required)
2. ✓ Check manifest.json is valid (use DevTools > Application > Manifest)
3. ✓ Ensure at least 192x192 icon exists
4. ✓ Verify service worker is registered
5. ✓ Check console for errors
6. ✓ Try hard refresh (Ctrl+Shift+R)

**Validation**:
```javascript
// Run in console
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    console.log('SW registered:', !!reg);
  });
}
```

### Service Worker Not Updating

**Issue**: Changes not reflected after deployment

**Solutions**:
1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear service worker**:
   - DevTools > Application > Service Workers
   - Click "Unregister"
   - Refresh page
3. **Skip waiting**:
   - DevTools > Application > Service Workers
   - Check "Update on reload"
   - Refresh
4. **Clear cache**:
   - DevTools > Application > Cache Storage
   - Right-click > Delete

**Prevention**:
- Add `skipWaiting: true` to `workboxOptions`
- Implement update notification UI

### Icons Not Showing

**Issue**: App icons not displaying correctly

**Solutions**:
1. ✓ Verify icon paths in manifest.json
2. ✓ Check icon files exist in `/public/icons/`
3. ✓ Validate icon format (PNG recommended over SVG)
4. ✓ Ensure icons are correct sizes
5. ✓ Check icons aren't corrupted (open in image viewer)
6. ✓ Clear cache and reinstall PWA

**Debug**:
```bash
# Check icon files exist
ls -la public/icons/

# Verify icon sizes
file public/icons/*.png
```

### Offline Page Not Showing

**Issue**: Offline page doesn't display when offline

**Solutions**:
1. ✓ Verify offline page exists at `/src/app/offline/page.tsx`
2. ✓ Check service worker is caching offline page
3. ✓ Ensure offline route is precached
4. ✓ Test in production build (not dev mode)

**Configuration**:
```typescript
// Add to next.config.ts
workboxOptions: {
  additionalManifestEntries: [
    { url: '/offline', revision: null },
  ],
}
```

### Manifest Errors

**Issue**: Manifest validation errors in DevTools

**Common Errors and Solutions**:

| Error | Solution |
|-------|----------|
| "Manifest not found" | Check manifest link in layout.tsx |
| "Invalid JSON" | Validate JSON syntax |
| "Icon size incorrect" | Verify icon dimensions |
| "Start URL not same origin" | Use relative path for start_url |
| "Display mode invalid" | Use valid value: standalone, fullscreen, minimal-ui |

**Validation**:
```bash
# Validate manifest JSON
cat public/manifest.json | npx jsonlint
```

### Cache Issues

**Issue**: Old content showing after update

**Solutions**:
1. **Version caches**: Update cache names on changes
2. **Set expiration**: Configure `maxAgeSeconds` in caching rules
3. **Clear old caches**: Implement cleanup logic
4. **Use skip waiting**: Force immediate updates

**Debug Cache**:
```javascript
// List all caches
caches.keys().then(names => console.log(names));

// Clear specific cache
caches.delete('cache-name');

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### HTTPS Required Error

**Issue**: "Service workers require HTTPS"

**Solutions**:
- **Development**: Use `localhost` (exempt from HTTPS requirement)
- **Production**: Deploy to platform with HTTPS (like Vercel)
- **Testing**: Use ngrok for local HTTPS testing

**Local HTTPS Setup**:
```bash
# Using mkcert (one-time setup)
brew install mkcert
mkcert -install
mkcert localhost
```

### Platform-Specific Issues

#### iOS Safari Issues

**Issue**: PWA not installing on iOS

**Solutions**:
- ✓ Use Safari (not Chrome on iOS)
- ✓ Ensure Apple touch icons are configured
- ✓ Add apple-mobile-web-app-capable meta tag
- ✓ Use PNG icons (not just SVG)

#### Android Chrome Issues

**Issue**: "Add to Home Screen" not appearing

**Solutions**:
- ✓ Wait for Chrome's install criteria to be met
- ✓ Verify manifest is valid
- ✓ Check engagement heuristics are met
- ✓ Use custom install prompt if needed

## Debugging Tools

### Chrome DevTools

**Essential Tabs**:
- **Application**: Manifest, Service Workers, Cache Storage
- **Network**: Offline testing, request monitoring
- **Lighthouse**: PWA audit, performance metrics
- **Console**: Error messages, service worker logs

### Command Line Tools

```bash
# Check service worker registration
npx lighthouse https://your-app.com --view --only-categories=pwa

# Validate manifest
npx pwa-asset-generator validate public/manifest.json

# Test offline functionality
npx serve out -p 3000 --cors
```

### Online Tools

- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Validator](https://manifest-validator.appspot.com/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

## Automated Testing

### Lighthouse CI

```bash
# Install
npm install -g @lhci/cli

# Run
lhci autorun --config=lighthouserc.json
```

**Configuration** (`lighthouserc.json`):
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:pwa": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

### Playwright Tests

```typescript
// e2e/pwa.spec.ts
import { test, expect } from '@playwright/test';

test('PWA is installable', async ({ page }) => {
  await page.goto('/');

  // Check manifest
  const manifest = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]');
    return link?.getAttribute('href');
  });
  expect(manifest).toBe('/manifest.json');

  // Check service worker
  const swRegistered = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    }
    return false;
  });
  expect(swRegistered).toBe(true);
});
```

## Best Practices for Testing

1. **Test in production mode**: PWA disabled in development
2. **Use real devices**: Mobile testing on actual phones
3. **Test on slow networks**: Use Chrome DevTools throttling
4. **Test all platforms**: Chrome, Safari, Firefox, Edge
5. **Automate where possible**: Use Lighthouse CI
6. **Monitor real users**: Use analytics to track PWA adoption
7. **Test updates**: Verify service worker updates work smoothly
8. **Test offline thoroughly**: Various offline scenarios
9. **Validate icons**: Check all sizes display correctly
10. **Check accessibility**: Ensure PWA is accessible to all users

## Continuous Monitoring

### Metrics to Track

- PWA install rate
- Offline usage percentage
- Service worker performance
- Cache hit rate
- Update adoption rate
- Platform distribution
- Lighthouse scores over time

### Tools

- Google Analytics 4 (PWA events)
- Sentry (error tracking)
- Lighthouse CI (automated audits)
- Chrome UX Report (real user metrics)

## Resources

- [Chrome DevTools PWA](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
- [Lighthouse PWA Audits](https://web.dev/pwa-checklist/)
- [PWA Testing Best Practices](https://web.dev/pwa-testing/)
- [Workbox Debugging](https://developer.chrome.com/docs/workbox/troubleshooting-and-logging/)

## Quick Reference

### Test Commands

```bash
# Build production
pnpm build

# Start production server
pnpm start

# Run Lighthouse
npx lighthouse http://localhost:3000 --view

# Validate manifest
curl http://localhost:3000/manifest.json | npx jsonlint

# Check service worker
curl http://localhost:3000/sw.js
```

### DevTools Shortcuts

- Open DevTools: `F12` or `Cmd+Opt+I`
- Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
- Toggle offline: DevTools > Network > Offline checkbox
- Clear cache: DevTools > Application > Clear storage
