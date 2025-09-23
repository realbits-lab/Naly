import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  console.log('🔍 Checking database schema...');

  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'generated_articles'
      ORDER BY ordinal_position
    `);

    console.log('📊 Database columns:');
    result.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.column_name} (${row.data_type})`);
    });
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkSchema();