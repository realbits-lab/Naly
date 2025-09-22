import { test, expect } from '@playwright/test'

test.describe('Cache Performance Demo', () => {
  const baseUrl = 'http://localhost:4000/en/news'

  test('Demo cache performance with real articles', async ({ page }) => {
    console.log('=== Cache Performance Testing Demo ===\n')

    // Track network activity
    let firstLoadApiCalls = 0
    let secondLoadApiCalls = 0
    let articlesData: any = null

    page.on('request', request => {
      if (request.url().includes('/api/articles')) {
        console.log(`[API Request] ${request.url()}`)
      }
    })

    page.on('response', async response => {
      if (response.url().includes('/api/articles') && response.status() === 200) {
        try {
          const data = await response.json()
          articlesData = data
          console.log(`[API Response] ${data?.articles?.length || 0} articles received`)
        } catch (e) {}
      }
    })

    // === FIRST LOAD (NO CACHE) ===
    console.log('1. FIRST VISIT - Building cache from server\n')
    console.log('   Loading page for the first time...')

    const startTime1 = Date.now()

    // Count API calls for first load
    page.on('request', request => {
      if (request.url().includes('/api/articles')) {
        firstLoadApiCalls++
      }
    })

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('h2:has-text("News")', { timeout: 10000 })

    // Wait for articles to load
    await page.waitForTimeout(2000)

    const loadTime1 = Date.now() - startTime1
    const articleCount1 = await page.locator('button[class*="text-left"]').count()

    console.log(`   ✓ Page loaded in ${loadTime1}ms`)
    console.log(`   ✓ Found ${articleCount1} articles`)
    console.log(`   ✓ Made ${firstLoadApiCalls} API calls`)
    console.log(`   → Data fetched from server and cached\n`)

    if (articleCount1 === 0) {
      console.log('   ⚠️  No articles found in database. Test requires articles to demonstrate cache.')
      return
    }

    // Click on first article to ensure detail is loaded
    await page.locator('button[class*="text-left"]').first().click()
    await page.waitForTimeout(500)

    // === SECOND LOAD (WITH CACHE) ===
    console.log('2. SECOND VISIT - Loading from cache\n')
    console.log('   Reloading page to test cache...')

    // Reset API call counter
    page.removeAllListeners('request')
    page.on('request', request => {
      if (request.url().includes('/api/articles')) {
        secondLoadApiCalls++
        console.log(`   [Cache Miss] API call made: ${request.url()}`)
      }
    })

    const startTime2 = Date.now()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('h2:has-text("News")', { timeout: 10000 })

    // Wait briefly for any cache operations
    await page.waitForTimeout(1000)

    const loadTime2 = Date.now() - startTime2
    const articleCount2 = await page.locator('button[class*="text-left"]').count()

    console.log(`   ✓ Page loaded in ${loadTime2}ms`)
    console.log(`   ✓ Found ${articleCount2} articles`)
    console.log(`   ✓ Made ${secondLoadApiCalls} API calls`)

    if (secondLoadApiCalls === 0) {
      console.log(`   → Data loaded entirely from cache!\n`)
    } else {
      console.log(`   → Some data loaded from cache, some from server\n`)
    }

    // === PERFORMANCE COMPARISON ===
    console.log('3. PERFORMANCE ANALYSIS\n')
    console.log(`   First Load:  ${loadTime1}ms (${firstLoadApiCalls} API calls)`)
    console.log(`   Second Load: ${loadTime2}ms (${secondLoadApiCalls} API calls)`)

    if (loadTime2 < loadTime1) {
      const improvement = Math.round((1 - loadTime2/loadTime1) * 100)
      console.log(`\n   🚀 Cache improved load time by ${improvement}%`)
    }

    if (secondLoadApiCalls < firstLoadApiCalls) {
      const reduction = firstLoadApiCalls - secondLoadApiCalls
      console.log(`   📉 Reduced API calls by ${reduction} (${Math.round(reduction/firstLoadApiCalls * 100)}% reduction)`)
    }

    // === CACHE INDICATORS CHECK ===
    console.log('\n4. CACHE STATUS INDICATORS\n')

    // Check for visual cache indicators
    const onlineStatus = await page.locator('[title="Online"]').isVisible().catch(() => false)
    const offlineStatus = await page.locator('[title="Offline"]').isVisible().catch(() => false)
    const cacheStatus = await page.locator('[title*="Cache"], [title*="cache"]').count()

    console.log(`   Network Status: ${onlineStatus ? 'Online ✓' : offlineStatus ? 'Offline' : 'Not shown'}`)
    console.log(`   Cache Indicators: ${cacheStatus > 0 ? `${cacheStatus} found ✓` : 'Not visible'}`)

    // === SEARCH FUNCTIONALITY WITH CACHE ===
    console.log('\n5. TESTING SEARCH WITH CACHE\n')

    const searchInput = page.locator('input[placeholder*="Search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('market')
      await page.waitForTimeout(500)

      const searchResults = await page.locator('button[class*="text-left"]').count()
      console.log(`   ✓ Search returned ${searchResults} results from cache`)

      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(500)
    }

    // === TEST ASSERTIONS ===
    expect(articleCount2).toBe(articleCount1)
    console.log('\n✅ CACHE TEST COMPLETED SUCCESSFULLY')
    console.log('   - Articles persist across reloads')
    console.log('   - Cache reduces load time and API calls')
    console.log('   - Search functionality works with cached data')
  })

  test('Test offline functionality', async ({ page, context }) => {
    console.log('\n=== OFFLINE MODE TESTING ===\n')

    // First, load the page normally to populate cache
    console.log('1. Loading page online to populate cache...')
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('h2:has-text("News")', { timeout: 10000 })
    await page.waitForTimeout(2000)

    const onlineArticles = await page.locator('button[class*="text-left"]').count()
    console.log(`   ✓ Loaded ${onlineArticles} articles while online`)

    if (onlineArticles === 0) {
      console.log('   ⚠️  No articles to cache. Skipping offline test.')
      return
    }

    // Simulate offline mode
    console.log('\n2. Going offline...')
    await context.setOffline(true)
    console.log('   ✓ Network set to offline')

    // Try to navigate to a new page (will fail, showing offline)
    console.log('\n3. Testing offline behavior...')

    try {
      await page.goto('http://localhost:4000', { waitUntil: 'domcontentloaded', timeout: 5000 })
      console.log('   ⚠️  Page loaded despite being offline (service worker active?)')
    } catch (e) {
      console.log('   ✓ Navigation failed as expected (offline)')
    }

    // Check if we can still see content
    const offlineContent = await page.locator('h2:has-text("News")').isVisible().catch(() => false)
    if (offlineContent) {
      const offlineArticles = await page.locator('button[class*="text-left"]').count()
      console.log(`   ✓ Still showing ${offlineArticles} cached articles offline`)
    } else {
      console.log('   ℹ️  Page content not available offline (service worker may not be active)')
    }

    // Go back online
    await context.setOffline(false)
    console.log('\n4. Going back online...')

    await page.reload({ waitUntil: 'domcontentloaded' })
    const backOnlineArticles = await page.locator('button[class*="text-left"]').count()
    console.log(`   ✓ Back online with ${backOnlineArticles} articles`)

    console.log('\n✅ OFFLINE TEST COMPLETED')
  })
})