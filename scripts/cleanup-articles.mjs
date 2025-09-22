import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(dirname(__dirname), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function cleanupArticles() {
  console.log("Starting article cleanup...");

  try {
    // Delete all RSS articles
    console.log("Deleting all RSS articles...");
    const result1 = await sql`DELETE FROM rss_articles`;
    console.log(`✅ Deleted ${result1.count} RSS articles from database`);

    // Delete all generated articles
    console.log("Deleting all generated articles...");
    const result2 = await sql`DELETE FROM generated_articles`;
    console.log(`✅ Deleted ${result2.count} generated articles from database`);

    console.log("\n✨ Cleanup completed successfully!");
    console.log("- All RSS articles removed");
    console.log("- All generated articles removed");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }

  process.exit(0);
}

// Run the cleanup
cleanupArticles();