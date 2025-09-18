#!/usr/bin/env node

/**
 * Script to remove all generated articles from the database
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { generatedArticles, articleTranslations } = require('../src/lib/schema');

async function clearGeneratedArticles() {
	try {
		console.log('🗑️  Starting to remove all generated articles...');

		// Get database URL from environment
		const DATABASE_URL = process.env.DATABASE_URL;
		if (!DATABASE_URL) {
			throw new Error('DATABASE_URL environment variable is required');
		}

		// Create database connection
		const sql = postgres(DATABASE_URL);
		const db = drizzle(sql);

		// First, get count of existing articles
		const countResult = await db.select({ count: sql`count(*)::int` }).from(generatedArticles);
		const totalArticles = countResult[0]?.count || 0;

		console.log(`📊 Found ${totalArticles} generated articles to remove`);

		if (totalArticles === 0) {
			console.log('✅ No generated articles found. Database is already clean.');
			await sql.end();
			return;
		}

		// Delete article translations first (foreign key constraint)
		console.log('🔄 Removing article translations...');
		const deletedTranslations = await db.delete(articleTranslations);
		console.log(`✅ Removed article translations`);

		// Delete generated articles
		console.log('🔄 Removing generated articles...');
		const deletedArticles = await db.delete(generatedArticles);
		console.log(`✅ Removed all ${totalArticles} generated articles`);

		// Verify deletion
		const verifyCountResult = await db.select({ count: sql`count(*)::int` }).from(generatedArticles);
		const remainingArticles = verifyCountResult[0]?.count || 0;

		if (remainingArticles === 0) {
			console.log('🎉 Successfully removed all generated articles from database!');
		} else {
			console.warn(`⚠️  Warning: ${remainingArticles} articles still remain in database`);
		}

		// Close database connection
		await sql.end();
		console.log('✅ Database connection closed');

	} catch (error) {
		console.error('❌ Failed to remove generated articles:', error);
		process.exit(1);
	}
}

// Run the script
if (require.main === module) {
	clearGeneratedArticles();
}

module.exports = { clearGeneratedArticles };