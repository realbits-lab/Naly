import fs from 'fs';

async function callGenerateReportWithAPIKey() {
  console.log('🚀 Calling real generate-report API with API key authentication...');

  try {
    // Read authentication data
    const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf8'));
    const apiKey = authData.credentials.apiKey;

    console.log('🔑 Using API key for manager account...');

    // Call the generate-report API
    console.log('📡 Calling /api/monitor/generate-report...');

    const response = await fetch('http://localhost:4000/api/monitor/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey
      }
    });

    const data = await response.json();

    console.log('📊 API Response Status:', response.status);

    if (response.status === 200) {
      console.log('✅ SUCCESS! Generate report API completed successfully!');
      console.log('📋 Response:', JSON.stringify(data, null, 2));

      if (data.reportId) {
        console.log('🆔 Report ID:', data.reportId);
        console.log('📝 Report Title:', data.reportTitle);
        console.log('📰 Articles Analyzed:', data.articlesAnalyzed);
        console.log('📦 Articles Archived:', data.articlesArchived);
        console.log('🏷️ Topics Count:', data.topicsCount);
      }
    } else {
      console.error('❌ API call failed:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error calling API:', error);
  }
}

callGenerateReportWithAPIKey().catch(console.error);