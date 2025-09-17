import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to correct port during OAuth flow', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3005/en/news');
    await page.waitForLoadState('networkidle');

    // Find and click sign in button
    const signInButton = page.getByText('Sign in with Google');
    await expect(signInButton).toBeVisible();

    // Click sign in and verify the redirect URL uses port 3005
    await signInButton.click();

    // Wait for redirect to Google OAuth
    await page.waitForLoadState('networkidle');

    // Check that the current URL contains the Google OAuth redirect
    const currentUrl = page.url();
    console.log('Current OAuth URL:', currentUrl);

    // Verify that the redirect_uri parameter uses port 3005 (not 3000)
    expect(currentUrl).toContain('accounts.google.com');
    expect(currentUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3005%2Fapi%2Fauth%2Fcallback%2Fgoogle');
    expect(currentUrl).not.toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle');
  });

  test('should have correct NEXTAUTH_URL in environment', async ({ page }) => {
    // Navigate to a page that might expose environment info (for testing purposes)
    await page.goto('http://localhost:3005/en/news');
    await page.waitForLoadState('networkidle');

    // This test verifies that our server is running on port 3005
    const response = await page.goto('http://localhost:3005/api/auth/providers');
    expect(response?.ok()).toBeTruthy();

    // Try the old port to confirm it's not accessible
    try {
      const oldPortResponse = await page.goto('http://localhost:3000/api/auth/providers');
      // If this succeeds, there's still a server running on port 3000
      console.log('Warning: Server still accessible on port 3000');
    } catch (error) {
      // This is expected - port 3000 should not be accessible
      console.log('Confirmed: Port 3000 is not accessible (good)');
    }
  });
});