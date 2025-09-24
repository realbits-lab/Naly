import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Test manager API key from .auth/user.json
const API_KEY = 'naly_test_7687773d9c0b0dbe1334b27fe61014bab3af656d5f2881f5cf39c50d0031e6be';

async function callGenerateReportAPI() {
  console.log('🚀 Calling generate-report API...');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔑 Using test manager API key for authentication');
  console.log('⚠️ Note: This API may take 2-3 minutes to complete due to AI processing');

  try {
    console.log('\n📝 Sending POST request to /api/monitor/generate-report...');

    // Create abort controller with 5 minute timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

    const response = await fetch('http://localhost:4000/api/monitor/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({}),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Response status:', response.status);
    console.log('📡 Response status text:', response.statusText);

    const responseText = await response.text();
    console.log('📄 Response length:', responseText.length);

    if (!response.ok) {
      console.error('❌ API call failed:', response.status);
      console.error('📄 Error response:', responseText.substring(0, 500));

      if (response.status === 401) {
        console.error('🔐 Authentication failed - API key may be invalid or expired');
      } else if (response.status === 403) {
        console.error('🚫 Permission denied - user may not have manager role');
      }

      return { success: false, error: responseText };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ API call successful!');
      console.log('📊 Response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.log('⚠️ Response is not JSON, showing raw text:');
      console.log(responseText.substring(0, 1000));
      responseData = { raw: responseText };
    }

    return { success: true, data: responseData };

  } catch (error: any) {
    console.error('\n❌ Error calling generate-report API:', error);

    if (error.name === 'AbortError') {
      console.error('⏱️ Request timed out after 5 minutes');
      console.log('💡 Tip: The API is still processing. Check server logs for status.');
    }

    return { success: false, error: error.message || error };
  }
}

// Run the API call
callGenerateReportAPI()
  .then(result => {
    console.log('\n✨ Final result:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.data) {
      console.log('📋 Data received:', result.data);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });