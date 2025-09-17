require("dotenv").config({ path: ".env.local" });
const { db } = require("./src/lib/db");
const { generatedArticles } = require("./src/lib/schema");

async function checkArticles() {
	try {
		console.log("🔍 Checking generated_articles table...\n");

		// Get all articles
		const articles = await db
			.select()
			.from(generatedArticles)
			.orderBy(generatedArticles.createdAt);

		console.log(`📊 Total articles found: ${articles.length}\n`);

		if (articles.length > 0) {
			console.log("📚 Recent articles:");
			console.log("=".repeat(80));

			articles.forEach((article, index) => {
				console.log(`\n${index + 1}. 📄 ${article.title}`);
				console.log(`   🆔 ID: ${article.id}`);
				console.log(`   👤 User ID: ${article.userId}`);
				console.log(`   📅 Created: ${article.createdAt}`);
				console.log(
					`   📊 ${article.wordCount} words, ${article.readingTime} min read`,
				);
				console.log(`   💭 Sentiment: ${article.sentiment}`);
				console.log(`   🏷️  Source Category: ${article.sourceCategory}`);
				console.log(`   🏢 Source Publisher: ${article.sourcePublisher}`);
				console.log(`   🔗 Source URL: ${article.sourceUrl}`);
				console.log(`   🤖 AI Model: ${article.aiModel || "N/A"}`);
				console.log(
					`   📝 Summary: ${article.summary ? article.summary.substring(0, 100) + "..." : "N/A"}`,
				);

				if (article.keyPoints && article.keyPoints.length > 0) {
					console.log(`   🔑 Key Points (${article.keyPoints.length}):`);
					article.keyPoints.slice(0, 3).forEach((point, i) => {
						console.log(`      ${i + 1}. ${point.substring(0, 60)}...`);
					});
				}
			});

			console.log("\n" + "=".repeat(80));
		} else {
			console.log("⚠️  No articles found in the database.");
		}

		process.exit(0);
	} catch (error) {
		console.error("❌ Error checking articles:", error);
		process.exit(1);
	}
}

checkArticles();
