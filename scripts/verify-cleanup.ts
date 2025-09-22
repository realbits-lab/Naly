import { db } from "@/lib/db";
import { rssArticles, generatedArticles } from "@/lib/schema";
import { sql } from "drizzle-orm";

async function verifyCleanup() {
  console.log("Verifying article cleanup...\n");

  try {
    // Count RSS articles
    const rssCount = await db.select({
      count: sql<number>`count(*)`
    }).from(rssArticles);

    console.log(`📊 RSS Articles remaining: ${rssCount[0].count}`);

    // Count generated articles
    const generatedCount = await db.select({
      count: sql<number>`count(*)`
    }).from(generatedArticles);

    console.log(`📊 Generated Articles remaining: ${generatedCount[0].count}`);

    console.log("\n" + "=".repeat(50));

    if (Number(rssCount[0].count) === 0 && Number(generatedCount[0].count) === 0) {
      console.log("✅ Verification successful: All articles have been deleted!");
    } else {
      console.log("⚠️ Warning: Some articles still exist in the database");
    }

  } catch (error) {
    console.error("❌ Error during verification:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the verification
verifyCleanup();