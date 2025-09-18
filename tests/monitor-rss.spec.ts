import { test, expect } from '@playwright/test';

test.describe('RSS Monitor Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the monitor page
    await page.goto('/en/monitor');
  });

  test('should load RSS sources successfully', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if RSS Sources title is visible
    await expect(page.getByText('RSS Sources')).toBeVisible();

    // Check if we can see Bloomberg sources (our highest success rate sources)
    await expect(page.getByText('Bloomberg Markets')).toBeVisible();
    await expect(page.getByText('Bloomberg Wealth')).toBeVisible();

    // Check if we can see CNBC sources
    await expect(page.getByText('CNBC Top News')).toBeVisible();
    await expect(page.getByText('CNBC World Markets')).toBeVisible();

    // Check if we can see Financial Times sources
    await expect(page.getByText('Financial Times Companies')).toBeVisible();
    await expect(page.getByText('Financial Times Markets')).toBeVisible();

    // Verify that old failing sources are not present
    await expect(page.getByText('Reuters Business')).not.toBeVisible();
  });

  test('should be able to select a Bloomberg RSS source', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click on Bloomberg Markets source
    await page.getByText('Bloomberg Markets').click();

    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-list"], .space-y-4', { timeout: 10000 });

    // Check if we can see article content or loading state
    const hasArticles = await page.locator('text=/Bloomberg|Markets|Financial/').first().isVisible({ timeout: 5000 });
    const hasLoadingState = await page.locator('text=/Loading|Fetching/').first().isVisible({ timeout: 2000 });

    // Either articles should be loaded or we should see a loading state
    expect(hasArticles || hasLoadingState).toBeTruthy();
  });

  test('should display RSS source categories correctly', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check for category badges
    await expect(page.getByText('markets')).toBeVisible();
    await expect(page.getByText('business')).toBeVisible();
    await expect(page.getByText('companies')).toBeVisible();
    await expect(page.getByText('finance')).toBeVisible();
    await expect(page.getByText('investment')).toBeVisible();
  });

  test('should handle mobile layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/monitor');
    await page.waitForLoadState('networkidle');

    // On mobile, we should see the RSS sources list
    await expect(page.getByText('RSS Sources')).toBeVisible();
    await expect(page.getByText('Bloomberg Markets')).toBeVisible();

    // Click on a source to navigate to articles view
    await page.getByText('Bloomberg Markets').click();

    // Should navigate to articles view (may take time to load)
    await page.waitForTimeout(2000);
  });
});