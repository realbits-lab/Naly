import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function listTables() {
  try {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('Available tables in database:');
    if (result && Array.isArray(result)) {
      result.forEach((row: any) => {
        console.log('-', row.table_name);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listTables();