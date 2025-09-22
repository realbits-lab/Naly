import { test, expect, ConsoleMessage } from '@playwright/test'

test.describe('Cache Console Log Analysis', () => {
  test('Analyze complete cache flow with console logs', async ({ page }) => {
    const consoleLogs: string[] = []
    const cacheEvents: any[] = []

    // Capture ALL console messages
    page.on('console', (msg: ConsoleMessage) => {
      const text = msg.text()
      consoleLogs.push(text)

      // Parse cache-related logs
      if (text.includes('[Cache]') || text.includes('[HTTP Cache]')) {
        cacheEvents.push({
          time: new Date().toISOString(),
          type: msg.type(),
          text: text,
          location: msg.location()
        })
      }
    })

    // Also capture network activity
    const networkEvents: any[] = []
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkEvents.push({
          time: new Date().toISOString(),
          type: 'request',
          url: request.url(),
          method: request.method()
        })
      }
    })

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        networkEvents.push({
          time: new Date().toISOString(),
          type: 'response',
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        })
      }
    })

    console.log('=' .repeat(80))
    console.log('CACHE FLOW ANALYSIS - COMPLETE CONSOLE LOG CAPTURE')
    console.log('=' .repeat(80))

    // VISIT 1: FIRST LOAD (NO CACHE)
    console.log('\n📍 VISIT 1: INITIAL PAGE LOAD (COLD CACHE)')
    console.log('-'.repeat(80))

    await page.goto('http://localhost:4000/en/news', {
      waitUntil: 'networkidle'
    })

    // Wait for page to stabilize
    await page.waitForTimeout(3000)

    console.log('\n🔍 CONSOLE LOGS FROM FIRST VISIT:')
    console.log('-'.repeat(40))
    cacheEvents.forEach((event, i) => {
      console.log(`[${i + 1}] ${event.text}`)
    })

    console.log('\n📊 NETWORK ACTIVITY:')
    console.log('-'.repeat(40))
    networkEvents.forEach(event => {
      if (event.type === 'request') {
        console.log(`→ ${event.method} ${event.url}`)
      } else {
        console.log(`← ${event.status} ${event.url}`)
        if (event.headers['etag']) {
          console.log(`  ETag: ${event.headers['etag']}`)
        }
        if (event.headers['cache-control']) {
          console.log(`  Cache-Control: ${event.headers['cache-control']}`)
        }
      }
    })

    // Clear logs for second visit
    const firstVisitCacheLogs = [...cacheEvents]
    const firstVisitNetworkLogs = [...networkEvents]
    cacheEvents.length = 0
    networkEvents.length = 0

    // VISIT 2: RELOAD (WITH CACHE)
    console.log('\n' + '='.repeat(80))
    console.log('📍 VISIT 2: PAGE RELOAD (WARM CACHE)')
    console.log('-'.repeat(80))

    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    console.log('\n🔍 CONSOLE LOGS FROM SECOND VISIT:')
    console.log('-'.repeat(40))
    cacheEvents.forEach((event, i) => {
      console.log(`[${i + 1}] ${event.text}`)
    })

    console.log('\n📊 NETWORK ACTIVITY:')
    console.log('-'.repeat(40))
    networkEvents.forEach(event => {
      if (event.type === 'request') {
        console.log(`→ ${event.method} ${event.url}`)
      } else {
        console.log(`← ${event.status} ${event.url}`)
      }
    })

    // ANALYSIS
    console.log('\n' + '='.repeat(80))
    console.log('📈 CACHE BEHAVIOR ANALYSIS')
    console.log('='.repeat(80))

    // Count cache hits and misses
    const cacheHits = cacheEvents.filter(e =>
      e.text.includes('Cache HIT') ||
      e.text.includes('304 Not Modified') ||
      e.text.includes('Using fresh cached data')
    ).length

    const cacheMisses = cacheEvents.filter(e =>
      e.text.includes('Cache MISS') ||
      e.text.includes('No cached data') ||
      e.text.includes('Fetching fresh data')
    ).length

    console.log(`\n📊 Cache Statistics:`)
    console.log(`  • Cache Hits: ${cacheHits}`)
    console.log(`  • Cache Misses: ${cacheMisses}`)
    console.log(`  • Total Cache Events: ${cacheEvents.length}`)
    console.log(`  • Network Requests (1st visit): ${firstVisitNetworkLogs.filter(e => e.type === 'request').length}`)
    console.log(`  • Network Requests (2nd visit): ${networkEvents.filter(e => e.type === 'request').length}`)

    // Check cache strategies used
    const strategies = {
      cacheFirst: cacheEvents.filter(e => e.text.includes('CACHE-FIRST')).length,
      networkFirst: cacheEvents.filter(e => e.text.includes('NETWORK-FIRST')).length,
      staleWhileRevalidate: cacheEvents.filter(e => e.text.includes('STALE-WHILE-REVALIDATE')).length,
      networkOnly: cacheEvents.filter(e => e.text.includes('NETWORK-ONLY')).length
    }

    console.log(`\n🎯 Cache Strategies Used:`)
    Object.entries(strategies).forEach(([strategy, count]) => {
      if (count > 0) {
        console.log(`  • ${strategy}: ${count} times`)
      }
    })

    // Check storage layers
    const storageLayers = {
      indexedDB: cacheEvents.filter(e => e.text.includes('IndexedDB')).length,
      httpCache: cacheEvents.filter(e => e.text.includes('[HTTP Cache]')).length,
      localStorage: cacheEvents.filter(e => e.text.includes('localStorage')).length,
      sessionStorage: cacheEvents.filter(e => e.text.includes('sessionStorage')).length
    }

    console.log(`\n💾 Storage Layers Accessed:`)
    Object.entries(storageLayers).forEach(([layer, count]) => {
      if (count > 0) {
        console.log(`  • ${layer}: ${count} times`)
      }
    })

    // VISIT 3: OFFLINE TEST
    console.log('\n' + '='.repeat(80))
    console.log('📍 VISIT 3: OFFLINE MODE TEST')
    console.log('-'.repeat(80))

    // Clear logs
    cacheEvents.length = 0
    networkEvents.length = 0

    // Go offline
    await page.context().setOffline(true)
    console.log('🔴 Set browser to OFFLINE mode')

    try {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 5000 })
    } catch (e) {
      console.log('⚠️ Page reload failed (expected in offline mode)')
    }

    await page.waitForTimeout(2000)

    console.log('\n🔍 CONSOLE LOGS FROM OFFLINE MODE:')
    console.log('-'.repeat(40))
    cacheEvents.forEach((event, i) => {
      console.log(`[${i + 1}] ${event.text}`)
    })

    // Check if any content is still visible
    const isContentVisible = await page.locator('h2:has-text("News")').isVisible().catch(() => false)
    console.log(`\n📱 Offline Content: ${isContentVisible ? 'AVAILABLE ✅' : 'NOT AVAILABLE ❌'}`)

    // Go back online
    await page.context().setOffline(false)
    console.log('\n🟢 Set browser back to ONLINE mode')

    // FINAL SUMMARY
    console.log('\n' + '='.repeat(80))
    console.log('✅ CACHE FLOW ANALYSIS COMPLETE')
    console.log('='.repeat(80))

    console.log('\n📋 Summary of Cache Behavior:')
    console.log('1. First Visit: Data fetched from server and cached')
    console.log('2. Second Visit: Data served from cache (if working properly)')
    console.log('3. Offline Mode: Cache should provide offline access')

    console.log('\n🎯 Cache Implementation Status:')
    if (cacheHits > 0 && networkEvents.length < firstVisitNetworkLogs.length) {
      console.log('✅ Cache is WORKING - reducing network requests')
    } else if (cacheHits > 0) {
      console.log('⚠️ Cache is PARTIALLY WORKING - some hits detected')
    } else {
      console.log('❌ Cache is NOT WORKING - no cache hits detected')
    }

    // Log all console messages for debugging
    console.log('\n' + '='.repeat(80))
    console.log('📜 COMPLETE CONSOLE LOG DUMP')
    console.log('='.repeat(80))
    consoleLogs.forEach((log, i) => {
      console.log(`[${i}] ${log}`)
    })
  })
})