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

async function addFullContentColumn() {
  console.log("Adding full_content column to rss_articles table...");

  try {
    // Add the full_content column
    await sql`
      ALTER TABLE rss_articles
      ADD COLUMN IF NOT EXISTS full_content TEXT
    `;

    console.log("✅ Successfully added full_content column to rss_articles table");

    // Verify the column was added
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'rss_articles'
      AND column_name = 'full_content'
    `;

    if (columns.length > 0) {
      console.log("✅ Verified: full_content column exists in rss_articles table");
    } else {
      console.log("⚠️ Warning: full_content column may not have been added");
    }

  } catch (error) {
    console.error("❌ Error adding column:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }

  process.exit(0);
}

// Run the migration
addFullContentColumn();