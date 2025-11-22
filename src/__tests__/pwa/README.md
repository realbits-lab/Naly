# PWA Test Suite

Comprehensive test suite for Progressive Web App (PWA) functionality in Naly.

## Test Files

### 1. `manifest.test.ts`
Tests the PWA manifest configuration (`public/manifest.json`):
- ✓ Required properties (name, short_name, start_url, display)
- ✓ Theme and background colors
- ✓ Icon configuration (all 8 sizes from 72x72 to 512x512)
- ✓ Additional properties (orientation, scope, lang, dir)
- ✓ App shortcuts
- **20 tests**

### 2. `config.test.ts`
Tests PWA build configuration and assets:
- ✓ Next.js PWA plugin configuration
- ✓ Service worker generation (after production build)
- ✓ Workbox runtime files
- ✓ Icon files existence and validity
- ✓ SVG structure and dimensions
- ✓ Package dependencies
- **38 tests**

### 3. `metadata.test.ts`
Tests PWA metadata in the app layout:
- ✓ Metadata export and structure
- ✓ Manifest reference
- ✓ Theme color configuration
- ✓ Apple Web App settings
- ✓ Viewport configuration
- ✓ Import statements
- **15 tests**

### 4. `offline-page.test.ts`
Tests the offline fallback page:
- ✓ Client component configuration
- ✓ User interface elements
- ✓ Retry functionality
- ✓ Tailwind CSS styling
- ✓ Accessibility features
- **11 tests**

### 5. `integration.test.ts`
Integration tests for overall PWA compliance:
- ✓ Required PWA files existence
- ✓ Theme consistency across files
- ✓ File structure validation
- ✓ Build configuration
- ✓ Documentation presence
- ✓ Accessibility features
- ✓ Performance considerations
- **20 tests**

## Running Tests

### Run all PWA tests
```bash
pnpm test src/__tests__/pwa/
```

### Run a specific test file
```bash
pnpm test src/__tests__/pwa/manifest.test.ts
```

### Run tests in watch mode
```bash
pnpm test:watch src/__tests__/pwa/
```

## Test Coverage

**Total: 104 tests across 5 test suites**

The test suite covers:
- Manifest validation and PWA compliance
- Icon generation and formatting
- Service worker configuration
- Metadata and theme consistency
- Offline functionality
- Build configuration
- Accessibility
- Performance

## Notes

### Service Worker Tests
Some tests check for service worker files (`sw.js`, `workbox-*.js`) which are only generated after a production build:

```bash
pnpm build
```

If these files don't exist, the tests will log a warning but won't fail, allowing development testing without a full production build.

### Production Build Requirement
To run all tests with full validation:
1. Ensure `.env` file is configured
2. Run production build: `pnpm build --webpack`
3. Run tests: `pnpm test src/__tests__/pwa/`

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run PWA Tests
  run: |
    pnpm install
    pnpm build
    pnpm test src/__tests__/pwa/
```

## Extending Tests

To add new PWA tests:
1. Create a new test file in `src/__tests__/pwa/`
2. Follow the naming convention: `*.test.ts`
3. Import required dependencies (`fs`, `path`, `jest`)
4. Use descriptive test names and group related tests with `describe()`
5. Run tests to verify they pass

## PWA Checklist

The test suite validates:
- ✅ Valid manifest.json with all required fields
- ✅ Icons in all required sizes (192x192, 512x512 minimum)
- ✅ Service worker configuration
- ✅ Offline fallback page
- ✅ Theme color consistency
- ✅ Apple Web App meta tags
- ✅ HTTPS requirement (production)
- ✅ Installability requirements
