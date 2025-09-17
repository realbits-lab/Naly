import 'dotenv/config';
import { randomUUID } from 'crypto';
import { db } from './src/lib/db';
import { generatedArticles, users } from './src/lib/schema';
import { NewsService } from './src/lib/news-service';
import { ArticleGenerator } from './src/lib/article-generator';

async function createTestArticle() {
  let testUserId: string;
  let testArticleId: string | undefined;

  try {
    console.log('🚀 Creating test article with latest news...\n');

    // Create test user first
    testUserId = randomUUID();
    console.log(`📝 Creating test user with ID: ${testUserId}`);

    const [createdUser] = await db.insert(users).values({
      id: testUserId,
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'RETAIL_INDIVIDUAL',
      subscriptionTier: 'free',
    }).returning();

    console.log(`✅ Test user created: ${createdUser.email}\n`);

    // Initialize services
    const newsService = new NewsService();
    const articleGenerator = new ArticleGenerator();

    // Fetch latest news
    console.log('📰 Fetching latest news...');
    const newsResult = await newsService.processLatestNews();
    const sourceArticle = newsResult.articles[0];

    console.log(`📄 Source article: "${sourceArticle.title}"`);
    console.log(`🏢 Source: ${sourceArticle.source}`);
    console.log(`🏷️  Category: ${sourceArticle.category}`);
    console.log(`💭 Sentiment: ${newsResult.relatedInfo.sentiment}\n`);

    // Generate article
    console.log('🤖 Generating AI analysis article...');
    const generatedArticle = await articleGenerator.generateArticle(
      sourceArticle,
      newsResult.relatedInfo
    );

    console.log(`📄 Generated title: "${generatedArticle.title}"`);
    console.log(`📊 Word count: ${generatedArticle.metadata.wordCount} words`);
    console.log(`⏱️  Reading time: ${generatedArticle.metadata.readingTime} min\n`);

    // Save to database
    console.log('💾 Saving article to database...');
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

    testArticleId = savedArticle.id;

    console.log('✅ Article saved successfully!');
    console.log(`🆔 Article ID: ${savedArticle.id}`);
    console.log(`📅 Created at: ${savedArticle.createdAt}`);
    console.log(`👤 User ID: ${savedArticle.userId}`);

    console.log('\n🎯 SUCCESS: Test article created and saved to database!');
    console.log(`📊 You can now find 1 article in the generated_articles table`);
    console.log(`🔍 Use: dotenv --file .env.local run npx tsx check-articles.ts`);

  } catch (error) {
    console.error('❌ Error creating test article:', error);
    process.exit(1);
  }
}

createTestArticle();