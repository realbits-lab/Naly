import { chromium } from 'playwright';

async function callRealGenerateReportAPI() {
  console.log('🚀 Calling real generate-report API with proper authentication...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Load existing authentication if available
  try {
    await context.storageState({ path: '.auth/user.json' });
    console.log('🔐 Loaded existing authentication state');
  } catch (error) {
    console.log('ℹ️ No existing auth state, will authenticate manually');
  }

  const page = await context.newPage();

  try {
    // First navigate to the site to establish session
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:4000');

    // Check if we're already authenticated
    const isAuthenticated = await page.locator('text=manager.ua77yxv4@test.naly.com').isVisible().catch(() => false);

    if (!isAuthenticated) {
      console.log('🔐 Need to authenticate - navigating to sign in...');

      // Try to find and click sign in button
      try {
        await page.click('text=Sign in', { timeout: 5000 });
        await page.waitForTimeout(2000);

        // Look for Google sign in
        await page.click('text=Sign in with Google', { timeout: 5000 });
        await page.waitForTimeout(3000);

        console.log('⚠️ Please complete Google OAuth authentication manually...');
        console.log('🔄 Waiting for authentication to complete...');

        // Wait for successful authentication (back to main page with user email)
        await page.waitForSelector('text=manager.ua77yxv4@test.naly.com', { timeout: 60000 });
        console.log('✅ Authentication successful!');

        // Save authentication state
        await context.storageState({ path: '.auth/user.json' });
        console.log('💾 Saved authentication state');

      } catch (error) {
        console.log('⚠️ Manual authentication required. Please sign in to the application first.');
        console.log('ℹ️ Navigate to http://localhost:4000 and sign in with manager.ua77yxv4@test.naly.com');
        await page.waitForTimeout(30000); // Give time for manual auth
      }
    } else {
      console.log('✅ Already authenticated');
    }

    // Now call the generate-report API
    console.log('📡 Calling /api/monitor/generate-report...');

    const response = await page.evaluate(async () => {
      const response = await fetch('/api/monitor/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include session cookies
      });

      const data = await response.json();
      return {
        status: response.status,
        data: data
      };
    });

    console.log('📊 API Response Status:', response.status);

    if (response.status === 200) {
      console.log('✅ SUCCESS! Generate report API completed successfully!');
      console.log('📋 Response:', JSON.stringify(response.data, null, 2));

      if (response.data.reportId) {
        console.log('🆔 Report ID:', response.data.reportId);
        console.log('📝 Report Title:', response.data.reportTitle);
        console.log('📰 Articles Analyzed:', response.data.articlesAnalyzed);
        console.log('📦 Articles Archived:', response.data.articlesArchived);
        console.log('🏷️ Topics Count:', response.data.topicsCount);
      }
    } else {
      console.error('❌ API call failed:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error calling API:', error);
  } finally {
    console.log('🔄 Keeping browser open for verification...');
    console.log('📱 Navigate to http://localhost:4000/en/news to see the generated report');
    console.log('⏸️ Press Ctrl+C to close browser when done');

    // Keep browser open for manual verification
    await page.waitForTimeout(300000); // Wait 5 minutes
    await browser.close();
  }
}

callRealGenerateReportAPI().catch(console.error);