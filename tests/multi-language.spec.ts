import { test, expect } from '@playwright/test';

test.describe('Multi-language functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display language switcher component', async ({ page }) => {
    // Look for language switcher button (could be in navigation or settings)
    const languageSwitcher = page.getByRole('button').filter({ hasText: /language|languages|영어|한국어/i });
    await expect(languageSwitcher.first()).toBeVisible();
  });

  test('should switch from English to Korean', async ({ page }) => {
    // Find and click language switcher
    const languageSwitcher = page.getByRole('button').filter({ hasText: /language|globe/i });
    await languageSwitcher.first().click();

    // Select Korean language
    const koreanOption = page.getByText(/korean|한국어/i);
    await koreanOption.click();

    // Verify URL contains Korean locale
    await expect(page).toHaveURL(/\/ko\//);

    // Verify Korean text is displayed
    const koreanText = page.getByText(/대시보드|기사|로그인/);
    await expect(koreanText.first()).toBeVisible();
  });

  test('should switch from Korean to English', async ({ page }) => {
    // Start from Korean page
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    // Find and click language switcher
    const languageSwitcher = page.getByRole('button').filter({ hasText: /language|globe/i });
    await languageSwitcher.first().click();

    // Select English language
    const englishOption = page.getByText(/english|영어/i);
    await englishOption.click();

    // Verify URL does not contain Korean locale (default English)
    await expect(page).toHaveURL(/^(?!.*\/ko\/).*/);

    // Verify English text is displayed
    const englishText = page.getByText(/dashboard|articles|sign in/i);
    await expect(englishText.first()).toBeVisible();
  });

  test('should persist language preference in local storage', async ({ page }) => {
    // Switch to Korean
    const languageSwitcher = page.getByRole('button').filter({ hasText: /language|globe/i });
    await languageSwitcher.first().click();

    const koreanOption = page.getByText(/korean|한국어/i);
    await koreanOption.click();

    // Check that language preference is stored in localStorage
    const storedLanguage = await page.evaluate(() => localStorage.getItem('user-locale'));
    expect(storedLanguage).toBe('ko');

    // Reload page and verify language persists
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on Korean page
    await expect(page).toHaveURL(/\/ko\//);
  });

  test('should set language preference cookie', async ({ page }) => {
    // Switch to Korean
    const languageSwitcher = page.getByRole('button').filter({ hasText: /language|globe/i });
    await languageSwitcher.first().click();

    const koreanOption = page.getByText(/korean|한국어/i);
    await koreanOption.click();

    // Check that cookie is set
    const cookies = await page.context().cookies();
    const languageCookie = cookies.find(cookie => cookie.name === 'user-locale');
    expect(languageCookie?.value).toBe('ko');
  });

  test('should show success message when changing language', async ({ page }) => {
    // Switch language
    const languageSwitcher = page.getByRole('button').filter({ hasText: /language|globe/i });
    await languageSwitcher.first().click();

    const koreanOption = page.getByText(/korean|한국어/i);
    await koreanOption.click();

    // Look for success toast/notification
    const successMessage = page.getByText(/language.*changed|언어.*변경/i);
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Article generation with translations', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in first (you may need to adapt this based on your auth flow)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click sign in button if visible
    const signInButton = page.getByRole('button', { name: /sign in/i });
    if (await signInButton.isVisible()) {
      await signInButton.click();

      // Handle Google OAuth sign-in (adapt to your auth setup)
      const googleButton = page.getByRole('button', { name: /google/i });
      if (await googleButton.isVisible()) {
        await googleButton.click();
        // You may need to handle OAuth flow here
        await page.waitForURL('/dashboard', { timeout: 30000 });
      }
    }
  });

  test('should generate article with Korean translation', async ({ page }) => {
    // Navigate to article generation page
    await page.goto('/articles');
    await page.waitForLoadState('networkidle');

    // Find article generator
    const generateButton = page.getByRole('button', { name: /generate.*article/i });
    await generateButton.click();

    // Fill in custom news (if needed)
    const titleInput = page.getByPlaceholder(/news.*headline|제목/i);
    const contentInput = page.getByPlaceholder(/news.*content|내용/i);

    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Financial News Title');
      await contentInput.fill('This is a test financial news content for multi-language testing. It contains important market information that should be translated to Korean.');

      const generateCustomButton = page.getByRole('button', { name: /generate.*custom/i });
      await generateCustomButton.click();
    }

    // Wait for generation to complete
    await page.waitForSelector('[data-testid="generated-article"]', { timeout: 60000 });

    // Verify article was generated
    const generatedArticle = page.getByTestId('generated-article');
    await expect(generatedArticle).toBeVisible();

    // Check for translation indicator
    const translationIndicator = page.getByText(/translation|번역/i);
    await expect(translationIndicator).toBeVisible();

    // Verify both languages are supported
    const supportedLanguages = page.getByText(/english|korean|영어|한국어/i);
    await expect(supportedLanguages.first()).toBeVisible();
  });

  test('should display article in Korean when Korean is selected', async ({ page }) => {
    // Switch to Korean first
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    // Navigate to articles
    await page.goto('/ko/articles');
    await page.waitForLoadState('networkidle');

    // Check that interface is in Korean
    const koreanText = page.getByText(/기사|생성/);
    await expect(koreanText.first()).toBeVisible();

    // If there are existing articles, check they display correctly
    const articles = page.getByRole('article').or(page.locator('[data-testid="article-card"]'));
    if (await articles.count() > 0) {
      await expect(articles.first()).toBeVisible();
    }
  });
});

test.describe('Language preference API', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is signed in for API tests
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should save language preference via API', async ({ page }) => {
    // Intercept API call
    const apiCall = page.waitForResponse('/api/user/language-preference');

    // Switch language
    const languageSwitcher = page.getByRole('button').filter({ hasText: /language|globe/i });
    await languageSwitcher.first().click();

    const koreanOption = page.getByText(/korean|한국어/i);
    await koreanOption.click();

    // Wait for API call to complete
    const response = await apiCall;
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
  });

  test('should fetch user language preferences', async ({ page, request }) => {
    // Make API call to get preferences
    const response = await request.get('/api/user/language-preference');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.defaultLanguage).toMatch(/en|ko/);
    }
    // If 401, user is not authenticated, which is acceptable for this test
  });
});

test.describe('URL routing and locale handling', () => {
  test('should redirect to appropriate locale based on browser language', async ({ page }) => {
    // Test with Korean browser language
    await page.goto('/', {
      extraHTTPHeaders: {
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });

    await page.waitForLoadState('networkidle');

    // Should redirect to Korean locale
    await expect(page).toHaveURL(/\/ko\//);
  });

  test('should handle direct navigation to Korean pages', async ({ page }) => {
    await page.goto('/ko/dashboard');
    await page.waitForLoadState('networkidle');

    // Should stay on Korean dashboard
    await expect(page).toHaveURL(/\/ko\/dashboard/);

    // Korean text should be visible
    const koreanText = page.getByText(/대시보드/);
    await expect(koreanText).toBeVisible();
  });

  test('should handle invalid locale gracefully', async ({ page }) => {
    await page.goto('/invalid-locale/dashboard');

    // Should redirect to valid locale or show 404
    await expect(page).toHaveURL(/\/(en\/)?dashboard|404|not.*found/);
  });
});

test.describe('Translation quality and content', () => {
  test('should display proper Korean financial terms', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    // Check for proper Korean financial terminology
    const financialTerms = [
      '시가총액', // Market Cap
      '거래량',   // Volume
      '주가',     // Stock Price
      '금융'      // Finance
    ];

    for (const term of financialTerms) {
      const termElement = page.getByText(term);
      if (await termElement.count() > 0) {
        await expect(termElement.first()).toBeVisible();
      }
    }
  });

  test('should maintain consistent navigation in both languages', async ({ page }) => {
    // Test English navigation
    await page.goto('/');
    const englishNav = await page.getByRole('navigation').textContent();

    // Test Korean navigation
    await page.goto('/ko');
    const koreanNav = await page.getByRole('navigation').textContent();

    // Both should have navigation content
    expect(englishNav?.length).toBeGreaterThan(0);
    expect(koreanNav?.length).toBeGreaterThan(0);

    // Content should be different (translated)
    expect(englishNav).not.toBe(koreanNav);
  });
});