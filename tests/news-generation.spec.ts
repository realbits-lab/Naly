import { test, expect } from '@playwright/test';

test.describe('News Generation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and handle authentication
    await page.goto('http://localhost:3005/en/news');
    await page.waitForLoadState('networkidle');

    // Check if already authenticated by looking for user menu or similar
    const signInButton = page.locator('text=Sign in with Google');
    if (await signInButton.isVisible()) {
      console.log('Not authenticated, signing in...');
      await signInButton.click();

      // Wait for authentication to complete (redirect back to news)
      await page.waitForURL('**/news', { timeout: 60000 });
      console.log('Authentication completed');
    } else {
      console.log('Already authenticated');
    }

    // Navigate to write page after ensuring authentication
    await page.goto('http://localhost:3005/en/write');
    await page.waitForLoadState('networkidle');
  });

  test('should select top news and generate article', async ({ page }) => {
    console.log('🚀 Starting news generation test...');

    // Click on Latest News Creation tab
    console.log('📰 Clicking Latest News Creation tab...');
    await page.click('text=Latest News Creation');
    await page.waitForTimeout(2000);

    // Wait for news articles to load
    console.log('⏳ Waiting for news articles to load...');
    await page.waitForSelector('input[type="checkbox"]', { timeout: 10000 });

    // Select the first few news articles (top news)
    console.log('☑️ Selecting top news articles...');
    const checkboxes = await page.$$('input[type="checkbox"]');

    if (checkboxes.length > 0) {
      // Select first 2-3 articles
      for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
        await checkboxes[i].check();
        console.log(`✅ Selected article ${i + 1}`);
        await page.waitForTimeout(500);
      }
    }

    // Wait for the generate button to become enabled
    await page.waitForTimeout(1000);

    // Find and click Generate from Selected button
    console.log('🎯 Looking for Generate from Selected button...');
    const generateButton = page.locator('text=Generate from Selected').first();

    await expect(generateButton).toBeVisible();

    const isEnabled = await generateButton.isEnabled();
    console.log(`🔘 Generate button enabled: ${isEnabled}`);

    if (isEnabled) {
      console.log('🚀 Clicking Generate from Selected...');
      await generateButton.click();

      // Wait for generation process to start
      console.log('⏳ Waiting for article generation process...');

      // Look for either progress dialog or completion message
      await page.waitForTimeout(3000);

      // Check for progress or completion
      const progressDialog = page.locator('text=Generating Article');
      const successMessage = page.locator('text=generated successfully');
      const errorMessage = page.locator('text=Failed');

      if (await progressDialog.isVisible()) {
        console.log('📊 Generation in progress...');
        // Wait for completion (max 45 seconds)
        await page.waitForTimeout(45000);
      }

      // Final check for success/error
      const finalSuccess = await successMessage.isVisible();
      const finalError = await errorMessage.isVisible();

      if (finalSuccess) {
        console.log('🎉 SUCCESS: Article generated successfully!');
        expect(finalSuccess).toBe(true);
      } else if (finalError) {
        console.log('❌ ERROR: Article generation failed');
        // This should not happen with our auth fix
        expect(finalError).toBe(false);
      } else {
        console.log('⏳ Generation may still be in progress');
        // Give it some more time
        await page.waitForTimeout(10000);
        const retrySuccess = await successMessage.isVisible();
        expect(retrySuccess).toBe(true);
      }

    } else {
      console.log('⚠️ Generate button is disabled - articles may not be selected properly');
      expect(isEnabled).toBe(true);
    }
  });
});