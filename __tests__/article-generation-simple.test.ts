import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { randomUUID } from 'crypto';
import { db } from '../src/lib/db';
import { generatedArticles, users } from '../src/lib/schema';
import { NewsService } from '../src/lib/news-service';
import { ArticleGenerator } from '../src/lib/article-generator';
import { eq } from 'drizzle-orm';

describe('Article Generation Core Functionality Test', () => {
  let newsService: NewsService;
  let articleGenerator: ArticleGenerator;
  let testArticleId: string | undefined;
  let testUserId: string;

  beforeAll(async () => {
    console.log('🚀 Starting Article Generation Core Test');

    // Create test user first
    testUserId = randomUUID();
    console.log(`📝 Creating test user with ID: ${testUserId}`);

    try {
      const [createdUser] = await db.insert(users).values({
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'RETAIL_INDIVIDUAL',
        subscriptionTier: 'free',
      }).returning();

      console.log(`✅ Test user created successfully: ${createdUser.id}`);

      // Verify user exists
      const verifyUser = await db.select().from(users).where(eq(users.id, testUserId));
      if (verifyUser.length === 0) {
        throw new Error('User creation verification failed');
      }
      console.log(`✅ User verification passed: ${verifyUser[0].email}`);

    } catch (error) {
      console.error('❌ Failed to create test user:', error);
      throw error;
    }

    // Initialize services
    newsService = new NewsService();
    articleGenerator = new ArticleGenerator();

    console.log('✅ Services initialized and test user created');
  });

  afterAll(async () => {
    // Cleanup: Remove test data from database
    if (testArticleId) {
      try {
        await db.delete(generatedArticles).where(eq(generatedArticles.id, testArticleId));
        console.log(`🧹 Cleaned up test article: ${testArticleId}`);
      } catch (error) {
        console.warn('⚠️  Failed to cleanup test article:', error);
      }
    }

    // Cleanup test user
    if (testUserId) {
      try {
        await db.delete(users).where(eq(users.id, testUserId));
        console.log(`🧹 Cleaned up test user: ${testUserId}`);
      } catch (error) {
        console.warn('⚠️  Failed to cleanup test user:', error);
      }
    }

    console.log('🏁 Test cleanup completed');
  });

  it('should fetch latest news from financial datasets API', async () => {
    console.log('\\n📰 Testing news fetching from Financial Datasets API...');

    try {
      // Test fetching latest news
      const newsResult = await newsService.processLatestNews();

      // Verify news was fetched
      expect(newsResult).toBeDefined();
      expect(newsResult.articles).toBeInstanceOf(Array);
      expect(newsResult.articles.length).toBeGreaterThan(0);
      expect(newsResult.relatedInfo).toBeDefined();

      // Display fetched news details
      const firstArticle = newsResult.articles[0];
      console.log('✅ Successfully fetched news:');
      console.log(`   📄 Title: ${firstArticle.title}`);
      console.log(`   🏢 Source: ${firstArticle.source}`);
      console.log(`   📅 Published: ${firstArticle.publishedAt}`);
      console.log(`   🏷️  Category: ${firstArticle.category}`);
      console.log(`   🔗 URL: ${firstArticle.url}`);
      console.log(`   📊 Sentiment: ${newsResult.relatedInfo.sentiment}`);
      console.log(`   🔑 Keywords: ${newsResult.relatedInfo.keywords.join(', ')}`);

      // Verify article structure
      expect(firstArticle.title).toBeDefined();
      expect(firstArticle.content).toBeDefined();
      expect(firstArticle.source).toBeDefined();
      expect(firstArticle.publishedAt).toBeDefined();
      expect(firstArticle.category).toBeDefined();

      // Verify related info structure
      expect(newsResult.relatedInfo.sentiment).toMatch(/^(positive|negative|neutral)$/);
      expect(newsResult.relatedInfo.keywords).toBeInstanceOf(Array);
      expect(newsResult.relatedInfo.entities).toBeInstanceOf(Array);

    } catch (error) {
      console.error('❌ Failed to fetch news from Financial Datasets API:', error);
      throw error;
    }
  }, 30000);

  it('should generate article using ArticleGenerator', async () => {
    console.log('\\n🤖 Testing article generation...');

    try {
      // First, fetch latest news
      console.log('📰 Fetching latest news for article generation...');
      const newsResult = await newsService.processLatestNews();
      const sourceArticle = newsResult.articles[0];

      console.log(`📄 Using source article: "${sourceArticle.title}"`);

      // Generate article
      console.log('🔄 Generating article...');
      const generatedArticle = await articleGenerator.generateArticle(
        sourceArticle,
        newsResult.relatedInfo
      );

      console.log('✅ Article generation successful:');
      console.log(`   📄 Title: ${generatedArticle.title}`);
      console.log(`   📊 Word Count: ${generatedArticle.metadata.wordCount}`);
      console.log(`   ⏱️  Reading Time: ${generatedArticle.metadata.readingTime} min`);
      console.log(`   💭 Sentiment: ${generatedArticle.metadata.sentiment}`);
      console.log(`   📝 Summary: ${generatedArticle.summary.substring(0, 100)}...`);
      console.log(`   🔑 Key Points: ${generatedArticle.keyPoints.length} points`);

      // Verify generated article structure
      expect(generatedArticle.title).toBeDefined();
      expect(generatedArticle.content).toBeDefined();
      expect(generatedArticle.summary).toBeDefined();
      expect(generatedArticle.keyPoints).toBeInstanceOf(Array);
      expect(generatedArticle.keyPoints.length).toBeGreaterThan(0);
      expect(generatedArticle.marketAnalysis).toBeDefined();
      expect(generatedArticle.investmentImplications).toBeDefined();
      expect(generatedArticle.metadata.wordCount).toBeGreaterThan(0);
      expect(generatedArticle.metadata.readingTime).toBeGreaterThan(0);

    } catch (error) {
      console.error('❌ Failed to generate article:', error);
      throw error;
    }
  }, 45000);

  it('should save generated article to database', async () => {
    console.log('\\n💾 Testing article saving to database...');

    try {
      // Generate a test article first
      const newsResult = await newsService.processLatestNews();
      const sourceArticle = newsResult.articles[0];
      const generatedArticle = await articleGenerator.generateArticle(
        sourceArticle,
        newsResult.relatedInfo
      );

      console.log('📝 Saving article to database...');
      console.log(`🔑 Using test user ID: ${testUserId}`);

      // Verify test user still exists before saving article
      const userCheck = await db.select().from(users).where(eq(users.id, testUserId));
      if (userCheck.length === 0) {
        throw new Error(`Test user ${testUserId} not found in database before article save`);
      }
      console.log(`✅ Test user verified before save: ${userCheck[0].email}`);

      // Save to database using the test user ID
      const [savedArticle] = await db.insert(generatedArticles).values({
        userId: testUserId,
        title: generatedArticle.title,
        content: generatedArticle.content,
        summary: generatedArticle.summary,
        keyPoints: generatedArticle.keyPoints,
        marketAnalysis: generatedArticle.marketAnalysis,
        investmentImplications: generatedArticle.investmentImplications,

        // Source information
        sourceTitle: sourceArticle.title,
        sourceContent: sourceArticle.content,
        sourceUrl: sourceArticle.url,
        sourcePublisher: sourceArticle.source,
        sourceCategory: sourceArticle.category,

        // Analysis metadata
        sentiment: newsResult.relatedInfo.sentiment,
        keywords: newsResult.relatedInfo.keywords,
        entities: newsResult.relatedInfo.entities,
        marketImpact: newsResult.relatedInfo.marketImpact,

        // Article metadata
        wordCount: generatedArticle.metadata.wordCount,
        readingTime: generatedArticle.metadata.readingTime,
        aiModel: process.env.OPENAI_API_KEY ? 'gpt-4' : 'mock',
        generationMethod: process.env.OPENAI_API_KEY ? 'ai' : 'mock',
      }).returning();

      // Store article ID for cleanup
      testArticleId = savedArticle.id;

      console.log('✅ Article saved successfully:');
      console.log(`   🆔 ID: ${savedArticle.id}`);
      console.log(`   📄 Title: ${savedArticle.title}`);
      console.log(`   👤 User ID: ${savedArticle.userId || 'test-user'}`);
      console.log(`   📅 Created At: ${savedArticle.createdAt}`);
      console.log(`   📊 Word Count: ${savedArticle.wordCount}`);
      console.log(`   💭 Sentiment: ${savedArticle.sentiment}`);

      // Verify saved article
      expect(savedArticle.id).toBeDefined();
      expect(savedArticle.title).toBeDefined();
      expect(savedArticle.content).toBeDefined();
      expect(savedArticle.summary).toBeDefined();
      expect(savedArticle.createdAt).toBeDefined();
      expect(savedArticle.wordCount).toBeGreaterThan(0);
      expect(savedArticle.readingTime).toBeGreaterThan(0);

    } catch (error) {
      console.error('❌ Failed to save article to database:', error);
      throw error;
    }
  }, 45000);

  it('should verify complete workflow and display database state', async () => {
    console.log('\\n📋 Testing complete workflow and displaying results...');

    try {
      // Get the latest generated articles for display
      const recentArticles = await db
        .select()
        .from(generatedArticles)
        .orderBy(generatedArticles.createdAt)
        .limit(5);

      console.log('\\n🎯 ARTICLE GENERATION WORKFLOW SUMMARY:');
      console.log('='.repeat(60));
      console.log(`📊 Total articles in database: ${recentArticles.length}`);

      if (recentArticles.length > 0) {
        console.log('\\n📚 Recent articles:');
        recentArticles.forEach((article, index) => {
          console.log(`\\n${index + 1}. 📄 ${article.title}`);
          console.log(`   🆔 ID: ${article.id}`);
          console.log(`   📅 Created: ${article.createdAt}`);
          console.log(`   📊 ${article.wordCount} words, ${article.readingTime} min read`);
          console.log(`   💭 Sentiment: ${article.sentiment}`);
          console.log(`   🏷️  Category: ${article.sourceCategory}`);
          console.log(`   🤖 AI Model: ${article.aiModel}`);
        });
      }

      console.log('\\n✅ CORE WORKFLOW TESTING COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(60));

      expect(recentArticles).toBeInstanceOf(Array);

    } catch (error) {
      console.error('❌ Failed to display workflow results:', error);
      throw error;
    }
  }, 15000);
});