#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load auth data
const authFile = path.join(__dirname, '..', '.auth', 'user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const apiKey = authData.credentials.apiKey;

console.log('🔑 Using API Key:', apiKey.substring(0, 20) + '...');
console.log('🧮 Testing RAW DATA PRESERVATION in reports...\n');

async function generateAndAnalyzeReport() {
    try {
        console.log('📊 Generating report with complete raw data...');
        const startTime = Date.now();

        // Generate report
        const generateResponse = await fetch('http://localhost:4000/api/monitor/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({})
        });

        const elapsedTime = Date.now() - startTime;
        console.log(`⏱️  Generation time: ${elapsedTime}ms`);

        if (!generateResponse.ok) {
            console.error('❌ Failed to generate report:', await generateResponse.text());
            return;
        }

        const result = await generateResponse.json();
        console.log('✅ Report generated!');
        console.log(`   Report ID: ${result.reportId}`);
        console.log(`   Articles: ${result.articlesAnalyzed}`);

        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch the report
        console.log('\n📖 Fetching report content...');
        const reportResponse = await fetch(`http://localhost:4000/api/articles/${result.reportId}`, {
            headers: { 'X-API-Key': apiKey }
        });

        if (!reportResponse.ok) {
            console.error('❌ Failed to fetch report');
            return;
        }

        const reportData = await reportResponse.json();
        const content = reportData.article.content;

        // Save report
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `raw-data-report-${timestamp}.md`;
        const filepath = path.join(__dirname, '..', 'articles', filename);

        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`\n💾 Report saved to: ${filename}`);

        // Analyze raw data preservation
        console.log('\n🔍 Analyzing Raw Data Preservation:');

        const checks = [
            {
                name: 'Complete Data Appendix',
                pattern: /# Complete Data Appendix/i,
                found: false
            },
            {
                name: 'Raw Financial Data Section',
                pattern: /## Raw Financial Data/i,
                found: false
            },
            {
                name: 'JSON Code Blocks',
                pattern: /```json/g,
                found: false,
                count: 0
            },
            {
                name: 'Complete Data Record',
                pattern: /# Complete Data Record/i,
                found: false
            },
            {
                name: 'Source Articles Summary Table',
                pattern: /## Source Articles Summary/i,
                found: false
            },
            {
                name: 'Stock Price Series Table',
                pattern: /Complete Stock Price Series/i,
                found: false
            },
            {
                name: 'Financial Performance Table',
                pattern: /Complete Financial Performance/i,
                found: false
            },
            {
                name: 'Raw Price Data JSON',
                pattern: /### Raw Price Data/i,
                found: false
            },
            {
                name: 'Raw Financial Data JSON',
                pattern: /### Raw Financial Data/i,
                found: false
            },
            {
                name: 'Extracted Numerical Data',
                pattern: /## Extracted Numerical Data/i,
                found: false
            }
        ];

        // Check each pattern
        checks.forEach(check => {
            if (check.name === 'JSON Code Blocks') {
                const matches = content.match(check.pattern);
                check.count = matches ? matches.length : 0;
                check.found = check.count > 0;
            } else {
                check.found = check.pattern.test(content);
            }
        });

        // Display results
        console.log('\n📊 Raw Data Preservation Analysis:');
        checks.forEach(check => {
            if (check.name === 'JSON Code Blocks') {
                console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.count} blocks found`);
            } else {
                console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? 'Present' : 'Missing'}`);
            }
        });

        // Calculate preservation score
        const preservationScore = (checks.filter(c => c.found).length / checks.length * 100).toFixed(1);
        console.log(`\n🎯 Data Preservation Score: ${preservationScore}%`);

        // Check for specific data types
        console.log('\n📈 Data Types Found:');
        const dataTypes = {
            'Large Numbers ($XXX,XXX,XXX)': /\$\d{1,3}(?:,\d{3}){2,}/g,
            'Decimal Prices ($XXX.XX)': /\$\d+\.\d{2}/g,
            'Percentages (XX.XX%)': /\d+\.\d{1,4}%/g,
            'Date Timestamps': /\d{4}-\d{2}-\d{2}/g,
            'Quarterly Periods': /Q[1-4]\s+\d{4}/g,
            'Million/Billion Values': /\$?\d+(?:\.\d+)?\s*(?:million|billion)/gi
        };

        Object.entries(dataTypes).forEach(([type, pattern]) => {
            const matches = content.match(pattern);
            const count = matches ? matches.length : 0;
            console.log(`   - ${type}: ${count} instances`);
            if (matches && matches.length > 0) {
                console.log(`     Examples: ${matches.slice(0, 3).join(', ')}`);
            }
        });

        // Check content size
        const contentSize = content.length;
        const hasExpandableContent = content.includes('<details>');
        const hasRawDataNotice = content.includes('Data Preservation Notice');

        console.log('\n📏 Report Statistics:');
        console.log(`   - Total size: ${(contentSize / 1024).toFixed(2)} KB`);
        console.log(`   - Has expandable content: ${hasExpandableContent ? 'Yes' : 'No'}`);
        console.log(`   - Has preservation notice: ${hasRawDataNotice ? 'Yes' : 'No'}`);

        // Overall assessment
        console.log('\n✨ Overall Assessment:');
        if (preservationScore >= 80) {
            console.log('   🏆 EXCELLENT: Raw data is comprehensively preserved');
        } else if (preservationScore >= 60) {
            console.log('   ✅ GOOD: Most raw data is preserved');
        } else if (preservationScore >= 40) {
            console.log('   ⚠️ PARTIAL: Some raw data is preserved');
        } else {
            console.log('   ❌ INSUFFICIENT: Raw data preservation needs improvement');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

generateAndAnalyzeReport().then(() => {
    console.log('\n🏁 Test completed!');
});