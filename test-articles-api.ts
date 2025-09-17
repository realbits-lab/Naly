import "dotenv/config";
import { desc } from "drizzle-orm";
import { db } from "./src/lib/db";
import { generatedArticles } from "./src/lib/schema";

async function testArticlesAPI() {
	try {
		console.log("🔍 Testing Articles API functionality directly...\n");

		// Simulate the API query that the endpoint would run
		const articles = await db
			.select({
				id: generatedArticles.id,
				title: generatedArticles.title,
				summary: generatedArticles.summary,
				keyPoints: generatedArticles.keyPoints,
				marketAnalysis: generatedArticles.marketAnalysis,
				investmentImplications: generatedArticles.investmentImplications,
				sourceTitle: generatedArticles.sourceTitle,
				sourcePublisher: generatedArticles.sourcePublisher,
				sourceCategory: generatedArticles.sourceCategory,
				sentiment: generatedArticles.sentiment,
				keywords: generatedArticles.keywords,
				entities: generatedArticles.entities,
				wordCount: generatedArticles.wordCount,
				readingTime: generatedArticles.readingTime,
				aiModel: generatedArticles.aiModel,
				createdAt: generatedArticles.createdAt,
			})
			.from(generatedArticles)
			.orderBy(desc(generatedArticles.createdAt))
			.limit(10);

		const totalCount = articles.length;

		console.log("✅ API Query Results:");
		console.log("=".repeat(80));

		const response = {
			articles,
			pagination: {
				total: totalCount,
				limit: 10,
				offset: 0,
				hasMore: false,
			},
			filters: {
				category: null,
				sentiment: null,
				search: null,
			},
		};

		console.log(`📊 Total articles: ${response.pagination.total}`);
		console.log(`📄 Returned: ${response.articles.length} articles\n`);

		if (response.articles.length > 0) {
			console.log("📰 Articles found:");
			console.log("=".repeat(80));

			response.articles.forEach((article, index) => {
				console.log(`\n${index + 1}. 📄 ${article.title}`);
				console.log(`   🆔 ID: ${article.id}`);
				console.log(`   📅 Created: ${article.createdAt}`);
				console.log(
					`   📊 ${article.wordCount} words, ${article.readingTime} min read`,
				);
				console.log(`   💭 Sentiment: ${article.sentiment}`);
				console.log(`   🏷️  Category: ${article.sourceCategory}`);
				console.log(`   🏢 Publisher: ${article.sourcePublisher}`);
				console.log(`   🤖 AI Model: ${article.aiModel}`);
				console.log(
					`   📝 Summary: ${article.summary ? article.summary.substring(0, 100) + "..." : "N/A"}`,
				);

				if (article.keyPoints && article.keyPoints.length > 0) {
					console.log(`   🔑 Key Points (${article.keyPoints.length}):`);
					article.keyPoints.slice(0, 2).forEach((point, i) => {
						console.log(`      ${i + 1}. ${point.substring(0, 60)}...`);
					});
				}
			});

			console.log("\n" + "=".repeat(80));
			console.log("\n🎯 API FUNCTIONALITY TEST COMPLETED SUCCESSFULLY!");
			console.log("📊 This data would be available at: GET /api/articles");
			console.log(
				"🌐 Page would be available at: /news-articles (requires auth)",
			);
		} else {
			console.log("⚠️  No articles found in database.");
			console.log(
				"💡 Run: dotenv --file .env.local run npx tsx create-test-article.ts",
			);
		}
	} catch (error) {
		console.error("❌ Error testing articles API:", error);
		process.exit(1);
	}
}

testArticlesAPI();
