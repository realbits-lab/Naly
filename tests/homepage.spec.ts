import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that page loads without errors
    await expect(page).toHaveURL('/');

    // Check for page title
    await expect(page).toHaveTitle(/Naly/);
  });

  test('should display main navigation elements', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for common navigation elements
    const navigation = page.locator('nav').first();
    await expect(navigation).toBeVisible();
  });

  test('should handle authentication redirect if not signed in', async ({ page }) => {
    await page.goto('/');

    // Wait for any redirects to complete
    await page.waitForLoadState('networkidle');

    // Page should either show landing page or redirect to auth
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(signin|auth|$)/);
  });

  test('should not have console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known warnings
    const realErrors = consoleErrors.filter(error =>
      !error.includes('debug-enabled') &&
      !error.includes('Warning:')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });
});