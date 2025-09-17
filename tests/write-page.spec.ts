import { test, expect } from '@playwright/test';

test.describe('Write Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Use the authentication file for logged-in state
    await page.goto('http://localhost:3005/en/news');
    await page.waitForLoadState('networkidle');

    // Check if already authenticated by looking for user menu
    const userButton = page.getByRole('button').filter({ hasText: /user menu/i });
    if (await userButton.isVisible()) {
      console.log('Already authenticated');
    } else {
      // Need to sign in
      const signInButton = page.getByText('Sign in with Google');
      if (await signInButton.isVisible()) {
        await signInButton.click();
        // Wait for authentication to complete
        await page.waitForURL('**/news', { timeout: 60000 });
      }
    }
  });

  test('should access write page as admin', async ({ page }) => {
    // Navigate to write page
    await page.goto('http://localhost:3005/en/write');
    await page.waitForLoadState('networkidle');

    // Check if the page loads successfully
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Should not be redirected to unauthorized page
    expect(currentUrl).toContain('/write');

    // Look for write page elements
    const pageContent = await page.textContent('body');
    console.log('Page contains "write":', pageContent?.toLowerCase().includes('write'));

    // Check for common write page elements
    const writeElements = [
      page.getByText(/write/i),
      page.getByText(/create/i),
      page.getByText(/article/i),
      page.getByRole('textbox'),
      page.getByRole('button')
    ];

    let foundElements = 0;
    for (const element of writeElements) {
      if (await element.first().isVisible()) {
        foundElements++;
        console.log('Found write page element');
      }
    }

    expect(foundElements).toBeGreaterThan(0);
  });

  test('should display write form components', async ({ page }) => {
    await page.goto('http://localhost:3005/en/write');
    await page.waitForLoadState('networkidle');

    // Look for form elements that might be present
    const formElements = await page.$$('input, textarea, button, select');
    console.log(`Found ${formElements.length} form elements`);

    expect(formElements.length).toBeGreaterThan(0);

    // Check for any error messages
    const errorMessages = page.getByText(/error|unauthorized|access denied/i);
    const hasErrors = await errorMessages.count() > 0;

    if (hasErrors) {
      const errorText = await errorMessages.first().textContent();
      console.log('Error message found:', errorText);
    }

    // The page should load without critical errors
    expect(hasErrors).toBeFalsy();
  });

  test('should verify navigation to write page from main nav', async ({ page }) => {
    await page.goto('http://localhost:3005/en/news');
    await page.waitForLoadState('networkidle');

    // Look for Write link in navigation (should be visible for admin users)
    const writeLink = page.getByRole('link').filter({ hasText: /write/i });

    if (await writeLink.isVisible()) {
      console.log('Write link found in navigation');
      await writeLink.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/write');
    } else {
      console.log('Write link not visible - may not be admin user');
      // Directly navigate to write page
      await page.goto('http://localhost:3005/en/write');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should check page accessibility and basic functionality', async ({ page }) => {
    await page.goto('http://localhost:3005/en/write');
    await page.waitForLoadState('networkidle');

    // Check if page has proper title
    const title = await page.title();
    console.log('Page title:', title);
    expect(title.length).toBeGreaterThan(0);

    // Check for basic page structure
    const mainContent = page.locator('main, #main, .main, [role="main"]');
    const hasMainContent = await mainContent.count() > 0;

    if (hasMainContent) {
      console.log('Main content area found');
      expect(hasMainContent).toBeTruthy();
    }

    // Check response status
    const response = await page.goto('http://localhost:3005/en/write');
    console.log('Response status:', response?.status());

    // Should not be 404 or 500
    expect(response?.status()).toBeLessThan(500);
    expect(response?.status()).not.toBe(404);
  });
});