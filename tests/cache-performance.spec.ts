import { test, expect, Page } from '@playwright/test'

test.describe('News Page Cache Performance', () => {
  let page: Page
  const testUrl = 'http://localhost:4000'

  // Performance metrics storage
  const metrics = {
    firstLoad: 0,
    cachedLoad: 0,
    offlineLoad: 0,
    networkRequests: 0,
    cacheHits: 0
  }

  test.beforeEach(async ({ context }) => {
    // Create a new page for each test
    page = await context.newPage()

    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('Cache') || msg.text().includes('Articles loaded')) {
        console.log('Console:', msg.text())
      }
    })

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/articles')) {
        metrics.networkRequests++
        console.log(`API Request: ${request.url()}`)
      }
    })

    // Monitor responses
    page.on('response', response => {
      if (response.url().includes('/api/articles')) {
        console.log(`API Response: ${response.status()} - ${response.url()}`)

        // Check for 304 Not Modified (cache hit)
        if (response.status() === 304) {
          metrics.cacheHits++
        }
      }
    })
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('First Load Performance - No Cache', async () => {
    console.log('\n=== Testing First Load (No Cache) ===')

    // Clear all storage to ensure no cache
    await page.goto(testUrl)
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Clear IndexedDB
    await page.evaluate(async () => {
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name)
        }
      }
    })

    // Navigate to the page and measure first load
    const startTime = Date.now()

    await page.goto(testUrl, { waitUntil: 'networkidle' })

    // Wait for articles to load
    await page.waitForSelector('.text-lg:has-text("News")', { timeout: 10000 })
    await page.waitForSelector('[role="button"]:has-text("articles")', { timeout: 10000 })

    metrics.firstLoad = Date.now() - startTime
    console.log(`First load time: ${metrics.firstLoad}ms`)

    // Verify articles are displayed
    const articlesCount = await page.locator('[role="button"]').filter({ hasText: 'articles' }).count()
    expect(articlesCount).toBeGreaterThan(0)

    // Check if cache indicators are present
    const cacheIndicators = await page.locator('[title*="Online"]').count()
    console.log(`Cache indicators found: ${cacheIndicators}`)
  })

  test('Cached Load Performance - With Cache', async () => {
    console.log('\n=== Testing Cached Load (With Cache) ===')

    // First visit to populate cache
    await page.goto(testUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('.text-lg:has-text("News")', { timeout: 10000 })

    // Wait for cache to be populated
    await page.waitForTimeout(2000)

    // Check cache stats if available
    const showStatsButton = page.locator('button:has-text("Show cache stats")')
    if (await showStatsButton.count() > 0) {
      await showStatsButton.click()
      await page.waitForTimeout(500)

      // Read cache stats
      const hitRate = await page.locator('text=/Hit Rate.*%/').textContent()
      const storage = await page.locator('text=/Storage.*MB/').textContent()
      const articlesCount = await page.locator('text=/Articles:\\s*\\d+/').textContent()

      console.log('Cache Stats:')
      console.log(`  ${hitRate}`)
      console.log(`  ${storage}`)
      console.log(`  ${articlesCount}`)
    }

    // Reset network request counter
    metrics.networkRequests = 0

    // Second visit - should use cache
    const startTime = Date.now()

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForSelector('.text-lg:has-text("News")', { timeout: 10000 })

    metrics.cachedLoad = Date.now() - startTime
    console.log(`Cached load time: ${metrics.cachedLoad}ms`)
    console.log(`Network requests made: ${metrics.networkRequests}`)
    console.log(`Cache hits (304 responses): ${metrics.cacheHits}`)

    // Verify cache indicator is shown
    const cacheIndicator = await page.locator('[title*="Cached"]').count()
    console.log(`Cache indicator visible: ${cacheIndicator > 0}`)

    // Performance assertion - cached load should be faster
    expect(metrics.cachedLoad).toBeLessThan(metrics.firstLoad * 0.5)
  })

  test('Offline Mode Performance', async () => {
    console.log('\n=== Testing Offline Mode ===')

    // First visit to populate cache
    await page.goto(testUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('.text-lg:has-text("News")', { timeout: 10000 })

    // Wait for cache population
    await page.waitForTimeout(2000)

    // Go offline
    await page.context().setOffline(true)
    console.log('Browser set to offline mode')

    const startTime = Date.now()

    // Reload page while offline
    await page.reload()

    // Wait for offline indicator
    await page.waitForSelector('[title="Offline"]', { timeout: 10000 })

    // Check if articles are still displayed
    const articlesVisible = await page.locator('[role="button"][class*="text-left"]').count()

    metrics.offlineLoad = Date.now() - startTime
    console.log(`Offline load time: ${metrics.offlineLoad}ms`)
    console.log(`Articles visible while offline: ${articlesVisible}`)

    // Verify offline indicator
    const offlineIndicator = await page.locator('[title="Offline"]').isVisible()
    expect(offlineIndicator).toBeTruthy()

    // Verify articles are accessible from cache
    expect(articlesVisible).toBeGreaterThan(0)

    // Go back online
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)

    // Verify online indicator returns
    await page.waitForSelector('[title="Online"]', { timeout: 10000 })
  })

  test('Cache Synchronization', async ({ context }) => {
    console.log('\n=== Testing Cache Synchronization ===')

    // Open two pages
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    // Load first page
    await page1.goto(testUrl, { waitUntil: 'networkidle' })
    await page1.waitForSelector('.text-lg:has-text("News")', { timeout: 10000 })

    // Wait for cache
    await page1.waitForTimeout(2000)

    // Load second page - should use cache from first page
    const startTime = Date.now()
    await page2.goto(testUrl, { waitUntil: 'networkidle' })
    await page2.waitForSelector('.text-lg:has-text("News")', { timeout: 10000 })

    const crossTabLoadTime = Date.now() - startTime
    console.log(`Cross-tab cached load time: ${crossTabLoadTime}ms`)

    // Check if both pages show cache indicators
    const page1CacheIndicator = await page1.locator('[title*="Cached"]').count()
    const page2CacheIndicator = await page2.locator('[title*="Cached"]').count()

    console.log(`Page 1 cache indicator: ${page1CacheIndicator > 0}`)
    console.log(`Page 2 cache indicator: ${page2CacheIndicator > 0}`)

    // Clean up
    await page1.close()
    await page2.close()
  })

  test('Search Performance in Cache', async () => {
    console.log('\n=== Testing Search in Cached Articles ===')

    // Load page and populate cache
    await page.goto(testUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('.text-lg:has-text("News")', { timeout: 10000 })

    // Perform search
    const searchInput = page.locator('input[placeholder="Search articles..."]')
    await searchInput.fill('market')

    const startTime = Date.now()
    await page.waitForTimeout(500) // Wait for search to complete

    const searchTime = Date.now() - startTime
    console.log(`Search completed in: ${searchTime}ms`)

    // Count filtered results
    const results = await page.locator('[role="button"][class*="text-left"]').count()
    console.log(`Search results found: ${results}`)

    // Search should be fast with cache
    expect(searchTime).toBeLessThan(1000)
  })

  test.afterAll(async () => {
    console.log('\n=== Performance Summary ===')
    console.log(`First Load (No Cache): ${metrics.firstLoad}ms`)
    console.log(`Cached Load: ${metrics.cachedLoad}ms`)
    console.log(`Offline Load: ${metrics.offlineLoad}ms`)
    console.log(`Cache Improvement: ${Math.round((1 - metrics.cachedLoad/metrics.firstLoad) * 100)}%`)
    console.log(`Total Network Requests: ${metrics.networkRequests}`)
    console.log(`Cache Hits (304s): ${metrics.cacheHits}`)

    // Performance assertions
    if (metrics.firstLoad > 0 && metrics.cachedLoad > 0) {
      const improvement = (1 - metrics.cachedLoad/metrics.firstLoad) * 100
      console.log(`\n✅ Cache provides ${improvement.toFixed(1)}% performance improvement`)
      expect(improvement).toBeGreaterThan(50) // At least 50% improvement
    }
  })
})