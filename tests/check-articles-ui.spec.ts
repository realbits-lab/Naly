import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Use stored auth state
test.use({
  storageState: '.auth/user.json'
});

test.describe('Article Generation Test Suite', () => {
  test('Step 2: Check UI for no articles after database cleanup', async ({ page }) => {
    console.log('🔍 Starting UI check for empty articles list...');

    // Navigate to news page
    await page.goto('http://localhost:4000/news');
    console.log('📍 Navigated to /news page');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded completely');

    // Check for articles or empty state
    const articles = await page.locator('[data-testid="article-item"], article, [class*="article"]').count();
    console.log(`📊 Found ${articles} articles on the page`);

    // Check for empty state message
    const emptyStateVisible = await page.locator('text=/no.*articles?|empty/i').isVisible().catch(() => false);
    const noResultsVisible = await page.locator('text=/no.*results?|nothing.*found/i').isVisible().catch(() => false);

    console.log(`📋 Empty state visible: ${emptyStateVisible}`);
    console.log(`📋 No results message visible: ${noResultsVisible}`);

    // Check for loading state
    const isLoading = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').count();
    console.log(`⏳ Loading elements found: ${isLoading}`);

    // Take screenshot for verification
    await page.screenshot({
      path: 'tests/screenshots/news-page-empty.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to tests/screenshots/news-page-empty.png');

    // Get page content for debugging
    const pageContent = await page.content();
    console.log('📄 Page HTML length:', pageContent.length);

    // Look for specific article containers
    const articleContainers = await page.locator('main article, main [class*="article"], main [class*="news"]').count();
    console.log(`📦 Article containers found: ${articleContainers}`);

    // Verify no articles are present
    expect(articles, 'Expected no articles to be present on the page').toBe(0);
    expect(articleContainers, 'Expected no article containers to be present').toBe(0);

    console.log('✅ Verification complete: No articles found on news page');
  });
});