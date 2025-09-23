import { db } from '../src/lib/db';
import { generatedArticles } from '../src/lib/schema/articles';
import { desc } from 'drizzle-orm';

async function checkGeneratedReport() {
	console.log('🔍 Checking latest generated report...');
	console.log('⏰ Timestamp:', new Date().toISOString());

	try {
		// Get the latest generated article
		const [latestReport] = await db
			.select()
			.from(generatedArticles)
			.orderBy(desc(generatedArticles.createdAt))
			.limit(1);

		if (!latestReport) {
			console.log('❌ No generated reports found');
			return;
		}

		console.log('\n📊 Report Details:');
		console.log('   ID:', latestReport.id);
		console.log('   Title:', latestReport.title);
		console.log('   Created:', latestReport.createdAt);
		console.log('   Content Length:', latestReport.content?.length || 0, 'characters');

		// Check if content includes company analysis section
		const content = latestReport.content || '';
		const hasCompanyDeepDive = content.includes('Featured Company Deep-Dive') ||
		                          content.includes('Featured Company Analysis');
		const hasAppleAnalysis = content.includes('Apple');

		console.log('\n✅ Company Analysis Check:');
		console.log('   Has Company Section:', hasCompanyDeepDive ? '✅ Yes' : '❌ No');
		console.log('   Mentions Apple:', hasAppleAnalysis ? '✅ Yes' : '❌ No');

		// Extract company section if it exists
		if (hasCompanyDeepDive || content.includes('Featured Company')) {
			const companyMatch = content.match(/# Featured Company.*?(?=\n#|\n\n#|$)/s);
			if (companyMatch) {
				console.log('\n📝 Company Analysis Section Found:');
				console.log('   Length:', companyMatch[0].length, 'characters');
				console.log('   Preview (first 500 chars):');
				console.log('   ', companyMatch[0].substring(0, 500) + '...');
			}
		}

		// Check for financial data tables
		const hasDataTables = content.includes('| Date') || content.includes('| Period');
		const hasFinancialMetrics = content.includes('revenue') || content.includes('Revenue');

		console.log('\n📊 Data Analysis:');
		console.log('   Has Data Tables:', hasDataTables ? '✅ Yes' : '❌ No');
		console.log('   Has Financial Metrics:', hasFinancialMetrics ? '✅ Yes' : '❌ No');

		// Save report to file for inspection
		const fs = await import('fs/promises');
		const reportPath = `articles/report-${latestReport.id}.md`;
		await fs.writeFile(reportPath, content || '');
		console.log(`\n💾 Report saved to: ${reportPath}`);

		console.log('\n✨ Report verification completed successfully!');

	} catch (error) {
		console.error('❌ Error checking report:', error);
	} finally {
		process.exit(0);
	}
}

checkGeneratedReport();