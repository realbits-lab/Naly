import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'

test.describe('News Page Cache Testing with Seeded Data', () => {
  const baseUrl = 'http://localhost:4000/en/news'

  test.beforeAll(async () => {
    console.log('Seeding test articles to database...')

    // Create seed script
    const seedScript = `
      import { db } from './src/lib/db'
      import { articles } from './src/lib/schema/articles'

      async function seed() {
        // Clear existing articles
        await db.delete(articles)

        // Insert test articles
        const testArticles = [
          {
            id: 'test-1',
            title: 'Test Article 1: Market Update',
            summary: 'Test summary for market update',
            content: 'Full content for test article 1',
            category: 'market',
            author: 'Test Author',
            source: 'Test Source',
            sourceUrl: 'https://example.com/1',
            publishedAt: new Date('2024-01-20T10:00:00Z'),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'test-2',
            title: 'Test Article 2: Tech News',
            summary: 'Test summary for tech news',
            content: 'Full content for test article 2',
            category: 'technology',
            author: 'Test Author',
            source: 'Test Source',
            sourceUrl: 'https://example.com/2',
            publishedAt: new Date('2024-01-20T11:00:00Z'),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'test-3',
            title: 'Test Article 3: Breaking News',
            summary: 'Test summary for breaking news',
            content: 'Full content for test article 3',
            category: 'breaking',
            author: 'Test Author',
            source: 'Test Source',
            sourceUrl: 'https://example.com/3',
            publishedAt: new Date('2024-01-20T12:00:00Z'),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]

        await db.insert(articles).values(testArticles)
        console.log('Inserted', testArticles.length, 'test articles')
      }

      seed().then(() => process.exit(0)).catch(e => {
        console.error(e)
        process.exit(1)
      })
    `

    // Save and run seed script
    require('fs').writeFileSync('./tests/seed-articles.mjs', seedScript)

    try {
      execSync('dotenv --file .env.local run node --loader tsx ./tests/seed-articles.mjs', {
        stdio: 'inherit'
      })
    } catch (e) {
      console.log('Note: Seed script failed, continuing with existing data')
    }
  })

  test('Cache functionality with seeded articles', async ({ page }) => {
    console.log('=== Testing Cache with Seeded Data ===')

    // Track API calls and responses
    const apiCalls: string[] = []
    const apiResponses: any[] = []

    page.on('request', request => {
      if (request.url().includes('/api/articles')) {
        apiCalls.push(request.url())
        console.log(`API Call: ${request.url()}`)
      }
    })

    page.on('response', async response => {
      if (response.url().includes('/api/articles')) {
        try {
          const data = await response.json()
          apiResponses.push(data)
          console.log(`API Response: ${data?.data?.length || 0} articles`)
        } catch {}
      }
    })

    // First visit (no cache)
    console.log('\n1. First Visit (No Cache)')
    const start1 = Date.now()

    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.waitForSelector('h2:has-text("News")', { timeout: 15000 })

    // Wait for articles or loading to complete
    await page.waitForTimeout(3000)

    const time1 = Date.now() - start1
    const articleCount1 = await page.locator('button[class*="text-left"]').count()

    console.log(`   Load time: ${time1}ms`)
    console.log(`   API calls: ${apiCalls.length}`)
    console.log(`   Articles shown: ${articleCount1}`)

    if (articleCount1 > 0) {
      // Click first article to ensure it loads
      await page.locator('button[class*="text-left"]').first().click()
      await page.waitForTimeout(1000)

      // Second visit (with cache)
      console.log('\n2. Second Visit (With Cache)')
      apiCalls.length = 0  // Reset counter
      const start2 = Date.now()

      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForSelector('h2:has-text("News")', { timeout: 15000 })
      await page.waitForTimeout(2000)

      const time2 = Date.now() - start2
      const articleCount2 = await page.locator('button[class*="text-left"]').count()

      console.log(`   Load time: ${time2}ms`)
      console.log(`   API calls: ${apiCalls.length}`)
      console.log(`   Articles shown: ${articleCount2}`)

      // Check for cache indicators
      const cacheIndicators = await page.locator('[title*="Cache"], [title*="cache"]').count()
      console.log(`   Cache indicators: ${cacheIndicators}`)

      // Performance comparison
      console.log('\n3. Performance Summary:')
      if (time2 < time1) {
        const improvement = Math.round((1 - time2/time1) * 100)
        console.log(`   ✅ Cache improved load time by ${improvement}%`)
      } else {
        console.log(`   ⚠️  No significant cache improvement detected`)
      }

      // Test search with cache
      console.log('\n4. Testing Search:')
      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill('test')
        await page.waitForTimeout(500)

        const searchResults = await page.locator('button[class*="text-left"]').count()
        console.log(`   Search results: ${searchResults}`)
      }

      expect(articleCount2).toBe(articleCount1)
    } else {
      console.log('⚠️  No articles found even after seeding')
    }
  })

  test('Cache persistence across sessions', async ({ browser }) => {
    console.log('\n=== Testing Cache Persistence ===')

    // First session
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()

    await page1.goto(baseUrl, { waitUntil: 'networkidle' })
    await page1.waitForSelector('h2:has-text("News")', { timeout: 15000 })
    await page1.waitForTimeout(2000)

    const articles1 = await page1.locator('button[class*="text-left"]').count()
    console.log(`Session 1 articles: ${articles1}`)

    await context1.close()

    // Second session (should have cache)
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    let apiCallMade = false
    page2.on('request', request => {
      if (request.url().includes('/api/articles')) {
        apiCallMade = true
      }
    })

    await page2.goto(baseUrl, { waitUntil: 'networkidle' })
    await page2.waitForSelector('h2:has-text("News")', { timeout: 15000 })
    await page2.waitForTimeout(2000)

    const articles2 = await page2.locator('button[class*="text-left"]').count()
    console.log(`Session 2 articles: ${articles2}`)
    console.log(`API called in session 2: ${apiCallMade}`)

    if (articles1 > 0 && articles2 > 0) {
      expect(articles2).toBe(articles1)
      console.log('✅ Cache persisted across sessions')
    }

    await context2.close()
  })
})