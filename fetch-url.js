#!/usr/bin/env node

const https = require('https');
const http = require('http');
const url = require('url');

// Get URL from command line arguments
const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('Usage: node fetch-url.js <url>');
  console.error('Example: node fetch-url.js https://api.example.com/data');
  process.exit(1);
}

// Validate URL
let parsedUrl;
try {
  parsedUrl = new URL(targetUrl);
} catch (error) {
  console.error('Error: Invalid URL provided');
  console.error(error.message);
  process.exit(1);
}

// Choose appropriate module based on protocol
const client = parsedUrl.protocol === 'https:' ? https : http;

console.log(`Fetching: ${targetUrl}`);
console.log('---');

const request = client.get(targetUrl, (response) => {
  console.log(`Status: ${response.statusCode} ${response.statusMessage}`);
  console.log('Headers:', response.headers);
  console.log('---');

  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    console.log('Response Body:');
    try {
      // Try to parse as JSON for better formatting
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (error) {
      // If not JSON, display as plain text
      console.log(data);
    }
  });
});

request.on('error', (error) => {
  console.error('Request failed:', error.message);
  process.exit(1);
});

request.setTimeout(10000, () => {
  console.error('Request timeout');
  request.destroy();
  process.exit(1);
});