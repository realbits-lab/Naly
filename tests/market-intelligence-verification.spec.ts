import { test, expect } from '@playwright/test';

test.describe('Market Intelligence Report Verification', () => {
  test('should display generated market intelligence report in news list', async ({ page }) => {
    console.log('🚀 Starting market intelligence report verification...');

    // Navigate to the news page
    await page.goto('http://localhost:4000/en/news');
    console.log('📄 Navigated to news page');

    // Wait for the page to load and articles to appear
    await page.waitForSelector('[data-testid="article-list"]', { timeout: 10000 });
    console.log('📋 Article list loaded');

    // Check if the market intelligence report appears in the list
    const marketReport = page.locator('text=Market Intelligence Report - September 23, 2025');
    await expect(marketReport).toBeVisible({ timeout: 5000 });
    console.log('✅ Market intelligence report found in list');

    // Verify the article has proper metadata
    const articleCard = page.locator('[data-testid="article-card"]').first();
    await expect(articleCard).toBeVisible();
    console.log('📝 Article card is visible');

    // Check reading time
    const readingTime = page.locator('text=/\\d+ min read/').first();
    await expect(readingTime).toBeVisible();
    console.log('⏱️ Reading time is displayed');

    // Check sentiment indicator
    const sentimentIndicator = page.locator('[data-testid="sentiment-indicator"]').first();
    if (await sentimentIndicator.isVisible()) {
      console.log('💭 Sentiment indicator is displayed');
    }

    // Click on the article to open it
    await marketReport.click();
    console.log('🖱️ Clicked on market intelligence report');

    // Wait for the article detail page to load
    await page.waitForLoadState('networkidle');
    console.log('📖 Article detail page loaded');

    // Verify we're on the article detail page
    await expect(page.locator('h1')).toContainText('Market Intelligence Report');
    console.log('✅ Article detail page displays correct title');

    // Check for key sections in the content
    const sections = [
      'Executive Summary',
      'Key Market Themes',
      'Sector Analysis',
      'Risk Assessment',
      'Market Outlook',
      'Investment Considerations'
    ];

    for (const section of sections) {
      const sectionHeader = page.locator(`text=${section}`);
      await expect(sectionHeader).toBeVisible();
      console.log(`✅ Found section: ${section}`);
    }

    // Check for quantitative data in the content
    const content = await page.locator('[data-testid="article-content"]').textContent();
    const hasQuantitativeData = /\$\d+|C\$\d+|\$\d+(\.\d+)?\s*(trillion|billion|million)/i.test(content || '');
    expect(hasQuantitativeData).toBe(true);
    console.log('✅ Article contains quantitative financial data');

    // Verify content length (should be substantial)
    const contentLength = (content || '').length;
    expect(contentLength).toBeGreaterThan(5000);
    console.log(`✅ Article content is substantial: ${contentLength} characters`);

    console.log('🎉 Market intelligence report verification completed successfully!');
  });

  test('should handle market intelligence report without infographic gracefully', async ({ page }) => {
    console.log('🚀 Testing market intelligence report infographic handling...');

    // Navigate to the news page
    await page.goto('http://localhost:4000/en/news');

    // Click on the market intelligence report
    const marketReport = page.locator('text=Market Intelligence Report - September 23, 2025');
    await marketReport.click();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if infographic tab exists (market intelligence reports may not have infographics)
    const infographicTab = page.locator('text=Infographic');

    if (await infographicTab.isVisible()) {
      console.log('📊 Infographic tab is available');
      await infographicTab.click();

      // Check if infographic content loads or shows appropriate message
      const infographicContent = page.locator('[data-testid="infographic-content"]');
      await expect(infographicContent).toBeVisible({ timeout: 5000 });
      console.log('✅ Infographic section loaded');
    } else {
      console.log('ℹ️ No infographic tab found (expected for market intelligence reports)');

      // Verify the article tab is selected and content is visible
      const articleTab = page.locator('text=Article');
      await expect(articleTab).toBeVisible();
      console.log('✅ Article tab is properly displayed');
    }

    console.log('🎉 Market intelligence infographic handling test completed!');
  });
});