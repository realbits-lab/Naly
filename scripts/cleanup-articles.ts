import { db } from "@/lib/db";
import { rssArticles, generatedArticles } from "@/lib/schema";

async function cleanupArticles() {
  console.log("Starting article cleanup...");

  try {
    // Delete all RSS articles
    console.log("Deleting all RSS articles...");
    const deletedRssArticles = await db.delete(rssArticles);
    console.log(`✅ Deleted all RSS articles from database`);

    // Delete all generated articles
    console.log("Deleting all generated articles...");
    const deletedGeneratedArticles = await db.delete(generatedArticles);
    console.log(`✅ Deleted all generated articles from database`);

    console.log("\n✨ Cleanup completed successfully!");
    console.log("- All RSS articles removed");
    console.log("- All generated articles removed");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the cleanup
cleanupArticles();