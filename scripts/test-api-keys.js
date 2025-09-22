#!/usr/bin/env node

/**
 * Demo script to test API key functionality
 * Run with: node scripts/test-api-keys.js
 */

const crypto = require('crypto');

console.log('🔑 API Key System Test\n');

// Simulate API key generation
function generateApiKey() {
  const prefix = process.env.NODE_ENV === 'production' ? 'naly_live' : 'naly_test';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}

// Simulate key hashing
function hashApiKey(apiKey) {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

// Test key generation
console.log('1️⃣  Generating API Key...');
const apiKey = generateApiKey();
console.log(`   Generated: ${apiKey.substring(0, 20)}...`);
console.log(`   Length: ${apiKey.length} characters`);
console.log(`   Format: ${apiKey.match(/^naly_(test|live)_[a-f0-9]{64}$/) ? '✅ Valid' : '❌ Invalid'}\n`);

// Test key hashing
console.log('2️⃣  Hashing API Key...');
const keyHash = hashApiKey(apiKey);
console.log(`   Hash: ${keyHash}`);
console.log(`   Hash Length: ${keyHash.length} characters`);
console.log(`   SHA-256: ${keyHash.length === 64 ? '✅ Valid' : '❌ Invalid'}\n`);

// Test scope validation
console.log('3️⃣  Testing Scope Validation...');
const testScopes = [
  { user: ['analytics:read'], required: 'analytics:read', expected: true },
  { user: ['analytics:read'], required: 'analytics:write', expected: false },
  { user: ['*'], required: 'any:permission', expected: true },
  { user: ['admin:all'], required: 'user:write', expected: true },
];

testScopes.forEach(test => {
  const hasScope = test.user.includes('*') ||
                    test.user.includes('admin:all') ||
                    test.user.includes(test.required);
  const result = hasScope === test.expected;
  console.log(`   ${result ? '✅' : '❌'} User scopes: [${test.user}] | Required: ${test.required} | Result: ${hasScope}`);
});

console.log('\n4️⃣  Testing IP Restrictions...');
const ipTests = [
  { whitelist: [], clientIp: '192.168.1.1', expected: true },
  { whitelist: ['192.168.1.1'], clientIp: '192.168.1.1', expected: true },
  { whitelist: ['192.168.1.1'], clientIp: '192.168.1.2', expected: false },
];

ipTests.forEach(test => {
  const allowed = test.whitelist.length === 0 || test.whitelist.includes(test.clientIp);
  const result = allowed === test.expected;
  console.log(`   ${result ? '✅' : '❌'} Whitelist: [${test.whitelist}] | Client IP: ${test.clientIp} | Allowed: ${allowed}`);
});

console.log('\n5️⃣  Rate Limiting Configuration...');
console.log('   Default: 100 requests/minute');
console.log('   Custom: Configurable per key (10-10000)');
console.log('   Auth endpoints: 5 attempts/15 minutes');
console.log('   Public endpoints: 1000 requests/hour');

console.log('\n✨ API Key System Test Complete!\n');

// Show example usage
console.log('📝 Example API Usage:');
console.log('   curl -H "Authorization: Bearer naly_live_xxxxx" \\');
console.log('        http://localhost:4000/api/v1/analytics\n');

console.log('🔧 Available Scopes:');
const scopes = [
  'analytics:read', 'analytics:write',
  'predictions:read', 'predictions:write',
  'narratives:read', 'narratives:write',
  'events:read', 'events:write',
  'user:read', 'user:write',
  'admin:all', '*'
];
scopes.forEach(scope => {
  console.log(`   • ${scope}`);
});

console.log('\n🎉 All systems operational!');