#!/usr/bin/env node

/**
 * Script to create an API key for the manager test account
 */

const crypto = require('crypto');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createApiKey() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database\n');

    // User details
    const userId = 'a8190034-e70a-463c-abef-82b71bf057c7';
    const userEmail = 'manager.ua77yxv4@test.naly.com';

    // Generate API key
    const prefix = process.env.NODE_ENV === 'production' ? 'naly_live' : 'naly_test';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const apiKey = `${prefix}_${randomBytes}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const lastFourChars = apiKey.slice(-4);

    // API key configuration
    const keyData = {
      name: 'Manager Test API Key',
      scopes: ['*'], // Full access for manager
      rateLimit: 1000, // Higher rate limit for testing
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };

    console.log('📝 Creating API key for:', userEmail);
    console.log('   Name:', keyData.name);
    console.log('   Scopes:', keyData.scopes);
    console.log('   Rate Limit:', keyData.rateLimit, 'req/min');
    console.log('   Expires:', keyData.expiresAt.toLocaleDateString());
    console.log('');

    // Insert into database
    const query = `
      INSERT INTO api_keys (
        user_id,
        name,
        key_hash,
        last_four_chars,
        scopes,
        rate_limit,
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;

    const values = [
      userId,
      keyData.name,
      keyHash,
      lastFourChars,
      JSON.stringify(keyData.scopes),
      keyData.rateLimit,
      keyData.expiresAt,
    ];

    const result = await client.query(query, values);
    const keyId = result.rows[0].id;

    console.log('✅ API key created successfully!');
    console.log('   Key ID:', keyId);
    console.log('');
    console.log('━'.repeat(80));
    console.log('🔑 YOUR API KEY (SAVE THIS - IT WILL NOT BE SHOWN AGAIN):');
    console.log('━'.repeat(80));
    console.log('');
    console.log(apiKey);
    console.log('');
    console.log('━'.repeat(80));
    console.log('');
    console.log('📋 How to use:');
    console.log('   curl -H "Authorization: Bearer ' + apiKey + '" \\');
    console.log('        http://localhost:4000/api/v1/analytics');
    console.log('');
    console.log('🔧 Test the key:');
    console.log('   # Get analytics data');
    console.log('   curl -H "Authorization: Bearer ' + apiKey.substring(0, 30) + '..." \\');
    console.log('        http://localhost:4000/api/v1/analytics');
    console.log('');
    console.log('   # Get user profile');
    console.log('   curl -H "Authorization: Bearer ' + apiKey.substring(0, 30) + '..." \\');
    console.log('        http://localhost:4000/api/v1/user/profile');
    console.log('');
    console.log('💾 Store this API key in a secure location!');

  } catch (error) {
    console.error('❌ Error creating API key:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the script
createApiKey();