#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load auth data
const authFile = path.join(__dirname, '..', '.auth', 'user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const apiKey = authData.credentials.apiKey;

console.log('🔑 Using API Key:', apiKey.substring(0, 20) + '...');
console.log('👤 Manager Account:', authData.credentials.email);
console.log('📊 Testing generate-report API endpoint...\n');

async function testGenerateReport() {
    try {
        const startTime = Date.now();

        const response = await fetch('http://localhost:4000/api/monitor/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                'User-Agent': 'Test-Script/1.0'
            },
            body: JSON.stringify({})
        });

        console.log(`⏱️  Request completed in ${Date.now() - startTime}ms`);
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

        const responseText = await response.text();

        if (!response.ok) {
            console.error('❌ API request failed:');
            console.error('Response:', responseText);
            return null;
        }

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Failed to parse JSON response:', e.message);
            console.error('Raw response:', responseText.substring(0, 500));
            return null;
        }

        console.log('✅ API Response:', JSON.stringify(responseData, null, 2));

        if (responseData.success) {
            console.log('\n🎉 Report generated successfully!');
            console.log(`📄 Report ID: ${responseData.reportId}`);
            console.log(`📰 Articles Analyzed: ${responseData.articlesAnalyzed}`);
            console.log(`🏷️  Topics Count: ${responseData.topicsCount}`);
            console.log(`💬 Message: ${responseData.message}`);

            return responseData.reportId;
        } else {
            console.error('❌ Report generation failed:', responseData);
            return null;
        }

    } catch (error) {
        console.error('❌ Request failed:', error.message);
        return null;
    }
}

async function checkReportContent(reportId) {
    if (!reportId) {
        console.log('⚠️  No report ID provided, skipping content check');
        return;
    }

    console.log('\n📖 Fetching generated report content...');

    try {
        const response = await fetch(`http://localhost:4000/api/articles/${reportId}`, {
            headers: {
                'X-API-Key': apiKey,
                'User-Agent': 'Test-Script/1.0'
            }
        });

        if (!response.ok) {
            console.error(`❌ Failed to fetch report content: ${response.status}`);
            return;
        }

        const reportData = await response.json();
        const content = reportData.article.content;

        console.log(`📊 Report Content Length: ${content.length} characters`);
        console.log('\n📋 Checking for required financial data sections...');

        // Check for company analysis section
        const hasCompanySection = content.includes('Featured Company Deep-Dive') ||
                                 content.includes('Company Analysis') ||
                                 content.includes('Financial Analysis');
        console.log(`🏢 Company Deep-Dive Section: ${hasCompanySection ? '✅ Found' : '❌ Missing'}`);

        // Check for specific financial data components
        const checks = [
            { name: 'Company Facts/Profile', patterns: ['company facts', 'profile', 'sector', 'industry', 'market cap', 'employees'] },
            { name: 'Recent News', patterns: ['recent news', 'news articles', 'developments', 'headlines'] },
            { name: 'Financial Statements', patterns: ['financial statements', 'revenue', 'net income', 'total assets', 'annual'] },
            { name: 'Press Releases/Earnings', patterns: ['press releases', 'earnings', 'earnings data'] },
            { name: 'SEC Filings', patterns: ['sec filings', 'regulatory documents', 'form type', 'filing'] },
            { name: 'Stock Price Performance', patterns: ['stock price', 'price performance', 'historical price', 'price change', 'current price'] }
        ];

        console.log('\n🔍 Detailed Financial Data Analysis:');
        for (const check of checks) {
            const found = check.patterns.some(pattern =>
                content.toLowerCase().includes(pattern.toLowerCase())
            );
            console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'Present' : 'Missing'}`);
        }

        // Show sample content
        console.log('\n📄 Sample Report Content (first 1000 chars):');
        console.log('═'.repeat(80));
        console.log(content.substring(0, 1000));
        if (content.length > 1000) {
            console.log('\n... [content truncated] ...');
        }
        console.log('═'.repeat(80));

        // Check for company-specific section
        if (hasCompanySection) {
            const companySectionStart = content.search(/# Featured Company Deep-Dive|# Company Analysis|# Financial Analysis/i);
            if (companySectionStart !== -1) {
                const companySection = content.substring(companySectionStart, companySectionStart + 2000);
                console.log('\n🏢 Company Analysis Section Preview:');
                console.log('─'.repeat(80));
                console.log(companySection);
                console.log('─'.repeat(80));
            }
        }

    } catch (error) {
        console.error('❌ Error fetching report content:', error.message);
    }
}

async function main() {
    console.log('🚀 Starting generate-report API test...\n');

    const reportId = await testGenerateReport();

    if (reportId) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        await checkReportContent(reportId);
    }

    console.log('\n🏁 Test completed!');
}

main().catch(console.error);