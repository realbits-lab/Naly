import { ArticleGenerator } from '../src/lib/article-generator';
import { db } from '../src/lib/db';
import { generatedArticles } from '../src/lib/schema/articles';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

async function generateTestArticle() {
  console.log('🚀 Generating test article with creative title...');

  const generator = new ArticleGenerator(process.env.AI_GATEWAY_API_KEY);

  // Sample news data about Apple's breakthrough
  const testNews = {
    title: "Apple's Revolutionary Quantum Computing Breakthrough Sends Shockwaves Through Tech Industry",
    content: `Apple Inc. has announced a groundbreaking achievement in quantum computing that could revolutionize the technology industry. The company revealed its new quantum processor capable of performing calculations 10,000 times faster than traditional supercomputers. This breakthrough positions Apple at the forefront of the quantum computing race, potentially disrupting markets worth trillions of dollars. Industry experts predict this could lead to revolutionary advances in AI, drug discovery, and financial modeling. The announcement caused Apple's stock to surge 8% in pre-market trading, with analysts upgrading their price targets across the board.`,
    url: 'https://example.com/apple-quantum-breakthrough',
    source: 'TechNews Today',
    category: 'Technology',
    publishedAt: new Date().toISOString()
  };

  // Related info with entities for company name extraction
  const relatedInfo = {
    sentiment: 'positive' as const,
    keywords: ['quantum computing', 'Apple', 'breakthrough', 'technology', 'AI', 'processor'],
    entities: ['Apple', 'Tim Cook', 'NASDAQ', 'Intel', 'IBM', 'Google'],
    marketImpact: 'Significant positive impact expected on tech sector with Apple leading the quantum computing revolution'
  };

  try {
    // Generate the article with creative title using AI
    const generatedArticle = await generator.generateArticle(testNews, relatedInfo);

    console.log('✅ Article generated successfully!');
    console.log('📝 Creative Title:', generatedArticle.title);
    console.log('🏢 Company Name in Title:', generatedArticle.title.includes('Apple') ? 'Yes' : 'No');
    console.log('📊 Has Infographic:', generatedArticle.infographicContent ? 'Yes' : 'No');

    // Save to database (only include basic fields that should exist)
    const [savedArticle] = await db.insert(generatedArticles).values({
      // Core fields
      userId: '00000000-0000-0000-0000-000000000000', // System AI user ID
      title: generatedArticle.title,
      content: generatedArticle.content,
      summary: generatedArticle.summary,
      keyPoints: generatedArticle.keyPoints,
      marketAnalysis: generatedArticle.marketAnalysis,
      investmentImplications: generatedArticle.investmentImplications,

      // Source information
      sourceTitle: testNews.title,
      sourceContent: testNews.content,
      sourceUrl: 'https://example.com/test-article',
      sourcePublisher: testNews.source,
      sourceCategory: testNews.category,

      // Analysis metadata
      sentiment: generatedArticle.metadata?.sentiment || relatedInfo.sentiment,
      keywords: generatedArticle.keywords || relatedInfo.keywords,
      entities: generatedArticle.entities || relatedInfo.entities,
      marketImpact: generatedArticle.marketImpact,

      // Article metadata
      wordCount: generatedArticle.metadata?.wordCount || null,
      readingTime: generatedArticle.metadata?.readingTime || null,
      aiModel: generatedArticle.aiModel || 'mock',
      generationMethod: generatedArticle.generationMethod || 'mock',

      // Language support
      sourceLanguage: 'en',
      hasTranslations: 'false',

      // Infographic content - temporarily disabled due to schema sync issue
      // ...(generatedArticle.infographicContent && { infographicContent: generatedArticle.infographicContent }),
    }).returning();

    console.log('💾 Article saved to database with ID:', savedArticle.id);
    console.log('\n📋 Article Details:');
    console.log('- Title:', savedArticle.title);
    console.log('- Word Count:', savedArticle.wordCount);
    console.log('- Reading Time:', savedArticle.readingTime, 'minutes');
    console.log('- Sentiment:', savedArticle.sentiment);

    // Save infographic content to file
    if (generatedArticle.infographicContent) {
      const infographicPath = path.join(process.cwd(), 'articles', `infographic-${savedArticle.id}.html`);
      fs.writeFileSync(infographicPath, generatedArticle.infographicContent);
      console.log('📊 Infographic saved to:', infographicPath);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating article:', error);
    process.exit(1);
  }
}

generateTestArticle();