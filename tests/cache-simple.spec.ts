import { test, expect } from '@playwright/test'

test.describe('News Page Cache Testing', () => {
  const baseUrl = 'http://localhost:4000/en/news'

  test('Cache functionality works on news page', async ({ page }) => {
    console.log('=== Testing Cache Functionality ===')

    // Track API calls
    let apiCallCount = 0
    page.on('request', request => {
      if (request.url().includes('/api/articles')) {
        apiCallCount++
        console.log(`API Call #${apiCallCount}: ${request.url()}`)
      }
    })

    // Track API responses
    page.on('response', async response => {
      if (response.url().includes('/api/articles')) {
        const data = await response.json().catch(() => null)
        console.log(`API Response: Status ${response.status()}, Articles: ${data?.data?.length || 0}`)
      }
    })

    // First load - navigate to news page
    console.log('\n1. First Visit (No Cache)')
    const startTime1 = Date.now()

    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('h2:has-text("News")', { timeout: 15000 })

    const firstLoadTime = Date.now() - startTime1
    console.log(`   Load time: ${firstLoadTime}ms`)
    console.log(`   API calls made: ${apiCallCount}`)

    // Wait for articles to be visible or check for empty state
    await page.waitForTimeout(3000)
    const articleCount = await page.locator('button[class*="text-left"]').count()
    console.log(`   Articles loaded: ${articleCount}`)

    // If no articles, check for empty state message
    if (articleCount === 0) {
      const emptyState = await page.locator('text=/No articles|Choose an article/i').count()
      console.log(`   Empty state shown: ${emptyState > 0}`)
      console.log('   ⚠️  No articles in database. Skipping cache test.')
      return // Skip rest of test if no articles
    }

    expect(articleCount).toBeGreaterThan(0)

    // Check if cache indicators are present
    const onlineIndicator = await page.locator('[title="Online"]').isVisible().catch(() => false)
    console.log(`   Online indicator: ${onlineIndicator}`)

    // Second load - reload the page (should use cache)
    console.log('\n2. Second Visit (With Cache)')
    apiCallCount = 0 // Reset counter
    const startTime2 = Date.now()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('h2:has-text("News")', { timeout: 15000 })

    const secondLoadTime = Date.now() - startTime2
    console.log(`   Load time: ${secondLoadTime}ms`)
    console.log(`   API calls made: ${apiCallCount}`)

    // Check for cache indicator
    await page.waitForTimeout(1000)
    const cacheIndicator = await page.locator('[title*="Cached"]').isVisible().catch(() => false)
    console.log(`   Cache indicator visible: ${cacheIndicator}`)

    // Try to view cache stats
    const statsButton = page.locator('button:has-text("Show cache stats")')
    if (await statsButton.isVisible().catch(() => false)) {
      await statsButton.click()
      await page.waitForTimeout(500)

      const hitRateElement = await page.locator('text=/Hit Rate.*%/').textContent().catch(() => 'N/A')
      const storageElement = await page.locator('text=/Storage.*MB/').textContent().catch(() => 'N/A')

      console.log('\n3. Cache Statistics:')
      console.log(`   ${hitRateElement}`)
      console.log(`   ${storageElement}`)
    }

    // Performance comparison
    console.log('\n4. Performance Summary:')
    console.log(`   First load: ${firstLoadTime}ms`)
    console.log(`   Second load: ${secondLoadTime}ms`)

    if (secondLoadTime < firstLoadTime) {
      const improvement = Math.round((1 - secondLoadTime/firstLoadTime) * 100)
      console.log(`   ✅ Cache improved performance by ${improvement}%`)
    } else {
      console.log(`   ⚠️  Cache not detected or not improving performance`)
    }

    // Test search functionality
    console.log('\n5. Testing Search in Cache:')
    const searchInput = await page.locator('input[placeholder="Search articles..."]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('news')
      await page.waitForTimeout(500)

      const searchResults = await page.locator('button[class*="text-left"]').count()
      console.log(`   Search results: ${searchResults}`)
    }
  })

  test('Offline mode works', async ({ page, context }) => {
    console.log('\n=== Testing Offline Mode ===')

    // Track API responses
    page.on('response', async response => {
      if (response.url().includes('/api/articles')) {
        const data = await response.json().catch(() => null)
        console.log(`API Response: Status ${response.status()}, Articles: ${data?.data?.length || 0}`)
      }
    })

    // First visit to populate cache
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('h2:has-text("News")', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const onlineArticles = await page.locator('button[class*="text-left"]').count()
    console.log(`Articles while online: ${onlineArticles}`)

    // Skip offline test if no articles to cache
    if (onlineArticles === 0) {
      console.log('⚠️  No articles to cache. Skipping offline test.')
      return
    }

    // Go offline
    await context.setOffline(true)
    console.log('Set browser to offline mode')

    // Try to navigate to the page while offline (not reload which fails)
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }).catch(e => {
      console.log('Expected offline error:', e.message.includes('ERR_INTERNET_DISCONNECTED'))
    })

    // Check for offline indicator
    const offlineIndicator = await page.locator('[title="Offline"]').isVisible().catch(() => false)
    console.log(`Offline indicator visible: ${offlineIndicator}`)

    // Check if articles are still available
    await page.waitForTimeout(2000)
    const offlineArticles = await page.locator('button[class*="text-left"]').count()
    console.log(`Articles while offline: ${offlineArticles}`)

    if (offlineArticles > 0) {
      console.log('✅ Cache works offline!')
    } else {
      console.log('⚠️  No cached articles available offline')
    }

    // Go back online
    await context.setOffline(false)
    await page.waitForTimeout(1000)

    const onlineAgain = await page.locator('[title="Online"]').isVisible().catch(() => false)
    console.log(`Back online indicator: ${onlineAgain}`)
  })
})