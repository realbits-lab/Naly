#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load auth data
const authFile = path.join(__dirname, '..', '.auth', 'user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const apiKey = authData.credentials.apiKey;

console.log('🔑 Using API Key:', apiKey.substring(0, 20) + '...');
console.log('📊 Generating report with TIME SERIES DATA TABLES...\n');

async function generateReportWithSeries() {
    try {
        const startTime = Date.now();

        console.log('🚀 Starting report generation with enhanced time series tables...');

        const response = await fetch('http://localhost:4000/api/monitor/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({})
        });

        const elapsedTime = Date.now() - startTime;
        console.log(`⏱️  Report generation completed in ${elapsedTime}ms`);
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API request failed:', errorText);
            return null;
        }

        const result = await response.json();
        console.log('✅ Report generated successfully!');
        console.log(`📄 Report ID: ${result.reportId}`);
        console.log(`📰 Articles Analyzed: ${result.articlesAnalyzed}`);

        return result.reportId;

    } catch (error) {
        console.error('❌ Request failed:', error.message);
        return null;
    }
}

async function fetchAndAnalyzeReport(reportId) {
    if (!reportId) {
        console.log('⚠️  No report ID provided');
        return;
    }

    console.log('\n📖 Fetching generated report to analyze time series tables...');

    try {
        const response = await fetch(`http://localhost:4000/api/articles/${reportId}`, {
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            console.error(`❌ Failed to fetch report: ${response.status}`);
            return;
        }

        const reportData = await response.json();
        const content = reportData.article.content;

        console.log(`📊 Report Content Length: ${content.length} characters`);

        // Save to file
        const articlesDir = path.join(__dirname, '..', 'articles');
        if (!fs.existsSync(articlesDir)) {
            fs.mkdirSync(articlesDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `series-report-${timestamp}.md`;
        const filepath = path.join(articlesDir, filename);

        const markdownContent = `---
title: "Time Series Data Report"
reportId: "${reportId}"
generated: "${new Date().toISOString()}"
---

${content}
`;

        fs.writeFileSync(filepath, markdownContent, 'utf8');

        console.log(`\n💾 Report saved to: ${filename}`);

        // Analyze for time series tables
        console.log('\n🔍 Analyzing report for time series tables...');

        // Check for table markers
        const hasTableMarkers = content.includes('|') && content.includes('---|');
        const tableSections = content.split('|').length - 1;

        // Look for specific time series patterns
        const patterns = [
            { name: 'Daily Price Table', pattern: /Date\s*\|\s*Open\s*\|\s*High\s*\|\s*Low\s*\|\s*Close/i },
            { name: 'Quarterly Revenue Table', pattern: /Q[1-4]\s+20\d{2}/g },
            { name: 'Monthly Data Table', pattern: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+20\d{2}/g },
            { name: 'Historical Financial Table', pattern: /Period\s*\|\s*Revenue\s*\|\s*Net Income/i },
            { name: 'Stock Price Series', pattern: /\d{4}-\d{2}-\d{2}\s*\|\s*\$?\d+\.\d{2}/g }
        ];

        console.log('\n📊 Time Series Table Analysis:');
        patterns.forEach(p => {
            const found = p.pattern.test(content);
            console.log(`   ${found ? '✅' : '❌'} ${p.name}: ${found ? 'Found' : 'Not Found'}`);
        });

        console.log(`\n📈 Table Statistics:`);
        console.log(`   - Has table formatting: ${hasTableMarkers ? 'Yes' : 'No'}`);
        console.log(`   - Pipe characters found: ${tableSections}`);

        // Extract and display sample table if found
        const tableMatch = content.match(/\|.*\|[\r\n]+\|[-:\s|]+\|[\r\n]+(\|.*\|[\r\n]+){3,}/);
        if (tableMatch) {
            console.log('\n📋 Sample Table Found:');
            console.log(tableMatch[0].substring(0, 500) + '...\n');
        }

        // Count specific numerical patterns
        const pricePattern = /\$\d+\.\d{2}/g;
        const percentPattern = /\d+\.\d{1,4}%/g;
        const largeNumberPattern = /\$?\d{1,3}(,\d{3})+(\.\d+)?/g;

        const prices = content.match(pricePattern) || [];
        const percents = content.match(percentPattern) || [];
        const largeNumbers = content.match(largeNumberPattern) || [];

        console.log('📊 Numerical Data Preserved:');
        console.log(`   - Stock prices with decimals: ${prices.length}`);
        console.log(`   - Percentage values: ${percents.length}`);
        console.log(`   - Large formatted numbers: ${largeNumbers.length}`);

        if (prices.length > 0) {
            console.log(`   - Sample prices: ${prices.slice(0, 5).join(', ')}`);
        }

        return hasTableMarkers && tableSections > 20; // Success if many table sections found

    } catch (error) {
        console.error('❌ Error fetching/analyzing report:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Testing time series table generation in reports...\n');

    const reportId = await generateReportWithSeries();

    if (reportId) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for processing
        const success = await fetchAndAnalyzeReport(reportId);

        if (success) {
            console.log('\n✅ SUCCESS: Time series data is being preserved in table format!');
        } else {
            console.log('\n⚠️  WARNING: Tables may not be fully formatted. Check the generated report.');
        }
    }

    console.log('\n🏁 Time series table test completed!');
}

main().catch(console.error);