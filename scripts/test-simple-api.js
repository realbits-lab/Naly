#!/usr/bin/env node

const API_KEY = 'naly_test_7687773d9c0b0dbe1334b27fe61014bab3af656d5f2881f5cf39c50d0031e6be';
const BASE_URL = 'http://localhost:4000';

async function testEndpoint(path, method = 'GET') {
  console.log(`\nTesting ${method} ${path}`);
  console.log('-'.repeat(50));

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status, response.statusText);

    // Print headers
    console.log('Headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('x-') || key.toLowerCase().includes('content')) {
        console.log(`  ${key}: ${value}`);
      }
    }

    // Try to get response text
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));

    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2).substring(0, 500));
    } catch (e) {
      console.log('Not valid JSON');
    }

    return response.status === 200;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('API Key Test - Simple Version');
  console.log('='.repeat(50));

  // Test endpoints
  await testEndpoint('/api/v1/user/profile');
  await testEndpoint('/api/v1/analytics');
  await testEndpoint('/api/v1/narratives');
  await testEndpoint('/api/v1/predictions');
  await testEndpoint('/api/v1/events');
}

main();