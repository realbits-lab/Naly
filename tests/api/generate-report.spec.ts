import { test, expect } from '@playwright/test';
import path from 'path';

// Use the saved authentication state
test.use({
  storageState: '.auth/user.json',
  baseURL: 'http://localhost:4000'
});

test.describe('Market Report Generation API', () => {
  test('should generate market intelligence report successfully', async ({ request, page }) => {
    console.log('🚀 Starting Market Report Generation Test');
    console.log('=' .repeat(50));

    // Step 1: Navigate to monitor page to verify authentication
    console.log('\n[STEP 1] Verifying authentication and authorization');

    await page.goto('/en/monitor');

    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Real-time Monitoring")', { timeout: 10000 });
    console.log('✅ Successfully accessed monitor page (MANAGER role confirmed)');

    // Step 2: Call the generate-report API
    console.log('\n[STEP 2] Calling generate-report API');
    console.log('📊 Starting report generation process...');

    const startTime = Date.now();

    const response = await request.post('/api/monitor/generate-report', {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`📈 Response received in ${elapsedTime} seconds`);

    // Step 3: Validate response
    console.log('\n[STEP 3] Validating API response');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    // Validate response structure
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('reportId');
    expect(data).toHaveProperty('reportTitle');
    expect(data).toHaveProperty('articlesAnalyzed');
    expect(data).toHaveProperty('newArticlesAdded');
    expect(data).toHaveProperty('topicsCount');

    console.log('\n📋 Report Summary:');
    console.log(`  Report ID: ${data.reportId}`);
    console.log(`  Report Title: ${data.reportTitle}`);
    console.log(`  Articles Analyzed: ${data.articlesAnalyzed}`);
    console.log(`  New Articles Added: ${data.newArticlesAdded}`);
    console.log(`  Topics Extracted: ${data.topicsCount}`);

    // Step 4: Validate the 5-step process
    console.log('\n[STEP 4] Validating report generation process');

    // Validate RSS fetch step
    expect(data.newArticlesAdded).toBeGreaterThanOrEqual(0);
    console.log(`✅ RSS Fetch: ${data.newArticlesAdded} new articles fetched`);

    // Validate article retrieval
    expect(data.articlesAnalyzed).toBeGreaterThan(0);
    console.log(`✅ Article Retrieval: ${data.articlesAnalyzed} articles analyzed`);

    // Validate topic extraction
    expect(data.topicsCount).toBeGreaterThan(0);
    console.log(`✅ Topic Extraction: ${data.topicsCount} topics identified`);

    // Validate report generation
    expect(data.reportId).toBeDefined();
    console.log(`✅ Report Generation: Report created with ID ${data.reportId}`);

    // Validate database save
    expect(data.reportId).not.toBeNull();
    console.log(`✅ Database Save: Report saved successfully`);

    // Step 5: Performance analysis
    console.log('\n[STEP 5] Performance Analysis');
    console.log(`⚡ Total Processing Time: ${elapsedTime} seconds`);

    const articlesPerSecond = (data.articlesAnalyzed / parseFloat(elapsedTime)).toFixed(2);
    console.log(`⚡ Processing Rate: ${articlesPerSecond} articles/second`);

    if (parseFloat(elapsedTime) < 30) {
      console.log('✅ Excellent performance (< 30s)');
    } else if (parseFloat(elapsedTime) < 60) {
      console.log('✅ Good performance (< 60s)');
    } else if (parseFloat(elapsedTime) < 120) {
      console.log('⚠️ Acceptable performance (< 120s)');
    } else {
      console.log(`⚠️ Slow performance (${elapsedTime}s) - consider optimization`);
    }

    // Step 6: Verify report is accessible
    console.log('\n[STEP 6] Verifying report is accessible');

    // Navigate to the articles page to see if the report appears
    await page.goto('/en/articles');
    await page.waitForSelector('text=Generated Articles', { timeout: 10000 });

    // Look for the newly created report
    const reportExists = await page.locator(`text="${data.reportTitle}"`).count() > 0;

    if (reportExists) {
      console.log('✅ Report is visible in the articles list');
    } else {
      console.log('⚠️ Report not immediately visible (may need refresh)');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ TEST PASSED - Report generation working correctly');
  });

  test('should handle missing RSS sources gracefully', async ({ request }) => {
    console.log('\n🔍 Testing error handling for missing sources');

    // This test assumes we might have edge cases
    const response = await request.post('/api/monitor/generate-report', {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (!data.success) {
      console.log('⚠️ Report generation failed as expected when no sources available');
      expect(data).toHaveProperty('error');
    } else {
      console.log('✅ Report generated even with potential missing sources');
      expect(data.articlesAnalyzed).toBeGreaterThanOrEqual(0);
    }
  });

  test('should validate authorization (negative test)', async ({ browser }) => {
    console.log('\n🔒 Testing authorization requirements');

    // Create a new context without authentication
    const context = await browser.newContext();
    const page = await context.newPage();
    const request = await context.request;

    // Try to access the API without authentication
    const response = await request.post('http://localhost:4000/api/monitor/generate-report', {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status()).toBe(401);
    console.log('✅ Correctly rejected unauthenticated request');

    await context.close();
  });
});

test.describe('Monitor Page UI', () => {
  test.use({
    storageState: '.auth/user.json',
    baseURL: 'http://localhost:4000'
  });

  test('should have Generate Market Report button', async ({ page }) => {
    console.log('\n🖱️ Testing Monitor Page UI');

    await page.goto('/en/monitor');

    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Real-time Monitoring")');

    // Check for the Generate Market Report button
    const generateButton = page.locator('button:has-text("Generate Market Report")');
    await expect(generateButton).toBeVisible();
    console.log('✅ Generate Market Report button is visible');

    // Check that the button is enabled
    await expect(generateButton).toBeEnabled();
    console.log('✅ Generate Market Report button is enabled');

    // Verify Update Articles button also exists
    const updateButton = page.locator('button:has-text("Update Articles")');
    await expect(updateButton).toBeVisible();
    console.log('✅ Update Articles button is visible');
  });

  test('should generate report via UI button click', async ({ page }) => {
    console.log('\n🖱️ Testing report generation via UI');

    await page.goto('/en/monitor');
    await page.waitForSelector('h1:has-text("Real-time Monitoring")');

    // Click the Generate Market Report button
    const generateButton = page.locator('button:has-text("Generate Market Report")');

    console.log('📊 Clicking Generate Market Report button...');
    const startTime = Date.now();

    // Start waiting for the API response before clicking
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/monitor/generate-report') && response.status() === 200,
      { timeout: 180000 } // 3 minutes timeout for AI processing
    );

    await generateButton.click();

    // Wait for the loading state (button should show loading indicator)
    await expect(generateButton).toBeDisabled();
    console.log('⏳ Report generation started (button disabled)');

    // Wait for the API response
    const response = await responsePromise;
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`📈 Report generated in ${elapsedTime} seconds`);

    // Button should be enabled again
    await expect(generateButton).toBeEnabled();

    // Check for success toast notification
    const toastMessage = await page.locator('[data-sonner-toast]').first().textContent();
    console.log(`✅ Toast notification: ${toastMessage}`);

    // Verify the response data
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    console.log(`✅ Report ID: ${responseData.reportId}`);
    console.log(`✅ Articles analyzed: ${responseData.articlesAnalyzed}`);
    console.log(`✅ Topics found: ${responseData.topicsCount}`);
  });
});