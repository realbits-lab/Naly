import { test, expect } from '@playwright/test';

test.describe('Font Color Readability Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate using the saved authentication state
    await page.goto('http://localhost:4000/en');
  });

  test('check news page font colors are readable (not grey)', async ({ page }) => {
    console.log('🎨 Testing font color readability in /en/news page...');

    // Navigate to news page
    await page.goto('http://localhost:4000/en/news');
    await page.waitForTimeout(2000);

    // Take a screenshot
    await page.screenshot({
      path: 'tests/screenshots/news-page-font-colors.png',
      fullPage: true
    });

    // Check for any articles on the page
    const articleElements = await page.locator('[data-testid="article-item"], .article-item, .news-item').count();

    if (articleElements > 0) {
      console.log(`✅ Found ${articleElements} articles on news page`);

      // Check font colors in article titles (should be dark, not grey)
      const titleElements = page.locator('h2, h3, .article-title, [data-testid="article-title"]');
      const titleCount = await titleElements.count();

      if (titleCount > 0) {
        // Check computed styles for first title
        const titleElement = titleElements.first();
        const titleColor = await titleElement.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.color;
        });

        console.log(`📝 Title color: ${titleColor}`);

        // Check that color is dark (not light grey)
        // RGB values should be low for dark colors
        const rgbMatch = titleColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          console.log(`💡 Title brightness: ${brightness} (should be < 128 for dark text)`);

          // Expect dark text (brightness < 128)
          expect(brightness).toBeLessThan(128);
        }
      }

      // Check body text colors
      const bodyElements = page.locator('p, .article-content, .article-summary, [data-testid="article-summary"]');
      const bodyCount = await bodyElements.count();

      if (bodyCount > 0) {
        const bodyElement = bodyElements.first();
        const bodyColor = await bodyElement.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.color;
        });

        console.log(`📄 Body text color: ${bodyColor}`);

        // Check that body text is also reasonably dark
        const rgbMatch = bodyColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          console.log(`💡 Body text brightness: ${brightness} (should be < 160 for readable text)`);

          // Expect readable text (brightness < 160)
          expect(brightness).toBeLessThan(160);
        }
      }

      // Click on first article to test individual article page
      const firstArticle = page.locator('[data-testid="article-item"], .article-item, .news-item').first();
      const firstArticleLink = firstArticle.locator('a').first();

      if (await firstArticleLink.count() > 0) {
        console.log('🔗 Clicking on first article to test article view page...');
        await firstArticleLink.click();
        await page.waitForTimeout(2000);

        // Take screenshot of article view
        await page.screenshot({
          path: 'tests/screenshots/article-view-font-colors.png',
          fullPage: true
        });

        // Check article content font colors
        const articleContent = page.locator('.article-content, .prose, main p, .content');
        if (await articleContent.count() > 0) {
          const contentColor = await articleContent.first().evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.color;
          });

          console.log(`📖 Article content color: ${contentColor}`);

          // Check that article content is dark and readable
          const rgbMatch = contentColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch) {
            const [, r, g, b] = rgbMatch.map(Number);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            console.log(`💡 Article content brightness: ${brightness} (should be < 128 for dark text)`);

            // Expect dark, readable text
            expect(brightness).toBeLessThan(128);
          }
        }
      }
    } else {
      console.log('ℹ️ No articles found on news page - checking empty state font colors');

      // Check empty state text colors
      const emptyStateText = page.locator('text=No articles found, text=No news available, .empty-state');
      if (await emptyStateText.count() > 0) {
        const emptyColor = await emptyStateText.first().evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.color;
        });

        console.log(`🈳 Empty state color: ${emptyColor}`);
      }
    }
  });
});