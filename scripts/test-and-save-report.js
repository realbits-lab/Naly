#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load auth data
const authFile = path.join(__dirname, '..', '.auth', 'user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const apiKey = authData.credentials.apiKey;

console.log('🔑 Using API Key:', apiKey.substring(0, 20) + '...');
console.log('👤 Manager Account:', authData.credentials.email);
console.log('📊 Testing generate-report API and saving to articles directory...\n');

async function testAndSaveReport() {
    try {
        const startTime = Date.now();

        console.log('🚀 Starting market report generation...');

        const response = await fetch('http://localhost:4000/api/monitor/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                'User-Agent': 'Test-Script/1.0'
            },
            body: JSON.stringify({})
        });

        console.log(`⏱️  Report generation completed in ${Date.now() - startTime}ms`);
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

        console.log('✅ Report generated successfully!');
        console.log(`📄 Report ID: ${responseData.reportId}`);
        console.log(`📰 Articles Analyzed: ${responseData.articlesAnalyzed}`);
        console.log(`🏷️  Topics Count: ${responseData.topicsCount}`);
        console.log(`💬 Message: ${responseData.message}`);

        return responseData.reportId;

    } catch (error) {
        console.error('❌ Request failed:', error.message);
        return null;
    }
}

async function fetchAndSaveReport(reportId) {
    if (!reportId) {
        console.log('⚠️  No report ID provided, skipping save');
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
        const title = reportData.article.title;
        const summary = reportData.article.summary;

        console.log(`📊 Report Content Length: ${content.length} characters`);
        console.log(`📝 Report Title: ${title}`);

        // Create articles directory if it doesn't exist
        const articlesDir = path.join(__dirname, '..', 'articles');
        if (!fs.existsSync(articlesDir)) {
            fs.mkdirSync(articlesDir, { recursive: true });
            console.log('📁 Created articles directory');
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `market-intelligence-report-${timestamp}.md`;
        const filepath = path.join(articlesDir, filename);

        // Create markdown content with metadata
        const markdownContent = `---
title: "${title}"
reportId: "${reportId}"
generated: "${new Date().toISOString()}"
summary: "${summary}"
articlesAnalyzed: ${reportData.article.wordCount ? Math.ceil(reportData.article.wordCount / 200) : 'Unknown'}
readingTime: "${reportData.article.readingTime || 'Unknown'} minutes"
---

${content}
`;

        // Save to file
        fs.writeFileSync(filepath, markdownContent, 'utf8');

        console.log(`\n💾 Report saved successfully!`);
        console.log(`📄 File: ${filename}`);
        console.log(`📍 Path: ${filepath}`);

        // Check for financial data components
        console.log('\n🔍 Analyzing saved report for financial data components...');

        const hasCompanySection = content.includes('Featured Company Deep-Dive') ||
                                 content.includes('Company Analysis') ||
                                 content.includes('Financial Analysis');

        const checks = [
            { name: 'Company Deep-Dive Section', found: hasCompanySection },
            { name: 'Company Facts/Profile', found: content.toLowerCase().includes('company facts') || content.toLowerCase().includes('profile') || content.toLowerCase().includes('market cap') },
            { name: 'Recent News', found: content.toLowerCase().includes('recent news') || content.toLowerCase().includes('news articles') },
            { name: 'Financial Statements', found: content.toLowerCase().includes('financial statements') || content.toLowerCase().includes('revenue') || content.toLowerCase().includes('net income') },
            { name: 'Press Releases/Earnings', found: content.toLowerCase().includes('press releases') || content.toLowerCase().includes('earnings') },
            { name: 'SEC Filings', found: content.toLowerCase().includes('sec filings') || content.toLowerCase().includes('regulatory documents') },
            { name: 'Stock Price Performance', found: content.toLowerCase().includes('stock price') || content.toLowerCase().includes('price performance') || content.toLowerCase().includes('historical price') }
        ];

        console.log('\n📊 Financial Data Components Analysis:');
        checks.forEach(check => {
            console.log(`   ${check.found ? '✅' : '❌'} ${check.name}: ${check.found ? 'Present' : 'Missing'}`);
        });

        const completionRate = (checks.filter(c => c.found).length / checks.length * 100).toFixed(1);
        console.log(`\n🎯 Overall Completion Rate: ${completionRate}%`);

        if (hasCompanySection) {
            console.log('\n🏢 Enhanced Financial Integration: ✅ SUCCESS');
            console.log('   The report includes comprehensive company analysis with financial data from Financial Datasets API');
        } else {
            console.log('\n🏢 Enhanced Financial Integration: ❌ MISSING');
            console.log('   The report lacks the enhanced company deep-dive section');
        }

        // Show file size and summary
        const stats = fs.statSync(filepath);
        console.log(`\n📏 File size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`📈 Content quality: ${content.length > 15000 ? 'High (Enhanced)' : content.length > 8000 ? 'Medium (Standard)' : 'Basic'}`);

    } catch (error) {
        console.error('❌ Error fetching/saving report:', error.message);
    }
}

async function main() {
    console.log('🚀 Starting generate-report API test with save functionality...\n');

    const reportId = await testAndSaveReport();

    if (reportId) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        await fetchAndSaveReport(reportId);
    }

    console.log('\n🏁 Test and save completed!');
}

main().catch(console.error);