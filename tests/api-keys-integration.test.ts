import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { apiKeyService } from '@/lib/services/api-key-service';
import { db } from '@/lib/db';
import { users, apiKeys } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('API Key Service - Integration Tests', () => {
  let testUserId: string;
  let testUserEmail: string;
  const createdKeyIds: string[] = [];

  beforeAll(async () => {
    // Create a test user
    testUserEmail = `test-${Date.now()}@example.com`;

    const [newUser] = await db.insert(users).values({
      email: testUserEmail,
      name: 'Test User',
      role: 'user',
    }).returning();

    testUserId = newUser.id;
  });

  afterAll(async () => {
    // Clean up created API keys
    for (const keyId of createdKeyIds) {
      try {
        await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Clean up test user
    if (testUserId) {
      try {
        await db.delete(users).where(eq(users.id, testUserId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Ensure database connection is closed
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Basic Operations', () => {
    it('should create an API key for existing user', async () => {
      const result = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'Integration Test Key',
        scopes: ['analytics:read', 'predictions:read'],
        rateLimit: 200,
      });

      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('keyId');
      expect(result).toHaveProperty('lastFourChars');
      expect(result.name).toBe('Integration Test Key');
      expect(result.scopes).toEqual(['analytics:read', 'predictions:read']);
      expect(result.apiKey).toMatch(/^naly_(test|live)_[a-f0-9]{64}$/);

      createdKeyIds.push(result.keyId);

      // Verify in database
      const dbKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, result.keyId),
      });

      expect(dbKey).toBeDefined();
      expect(dbKey?.userId).toBe(testUserId);
      expect(dbKey?.name).toBe('Integration Test Key');
      expect(dbKey?.rateLimit).toBe(200);
    });

    it('should validate an API key', async () => {
      const { apiKey, keyId } = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'Validation Test Key',
        scopes: ['analytics:read'],
      });

      createdKeyIds.push(keyId);

      const validated = await apiKeyService.validateApiKey(apiKey);

      expect(validated).not.toBeNull();
      expect(validated?.id).toBe(keyId);
      expect(validated?.name).toBe('Validation Test Key');
      expect(validated?.lastUsedAt).not.toBeNull();
    });

    it('should return null for invalid API key', async () => {
      const invalidKey = 'naly_test_invalid_key_12345';
      const result = await apiKeyService.validateApiKey(invalidKey);

      expect(result).toBeNull();
    });

    it('should list user API keys', async () => {
      // Create multiple keys
      const key1 = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'List Test Key 1',
        scopes: ['analytics:read'],
      });
      const key2 = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'List Test Key 2',
        scopes: ['predictions:read'],
      });

      createdKeyIds.push(key1.keyId, key2.keyId);

      // Get user's keys
      const userKeys = await apiKeyService.getUserApiKeys(testUserId);

      // Should include both keys
      const keyIds = userKeys.map(k => k.id);
      expect(keyIds).toContain(key1.keyId);
      expect(keyIds).toContain(key2.keyId);

      // Check properties
      const foundKey1 = userKeys.find(k => k.id === key1.keyId);
      expect(foundKey1?.name).toBe('List Test Key 1');
      expect(foundKey1?.isActive).toBe(true);
    });

    it('should revoke an API key', async () => {
      const { keyId } = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'Key to Revoke',
        scopes: ['analytics:read'],
      });

      createdKeyIds.push(keyId);

      // Revoke the key
      const success = await apiKeyService.revokeApiKey(keyId, testUserId);
      expect(success).toBe(true);

      // Verify it's revoked
      const dbKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, keyId),
      });

      expect(dbKey?.revokedAt).not.toBeNull();

      // Should not be able to revoke again
      const secondRevoke = await apiKeyService.revokeApiKey(keyId, testUserId);
      expect(secondRevoke).toBe(false);
    });
  });

  describe('Permission Checks', () => {
    it('should validate scopes correctly', () => {
      const tests = [
        { scopes: ['analytics:read'], required: 'analytics:read', expected: true },
        { scopes: ['analytics:read'], required: 'analytics:write', expected: false },
        { scopes: ['*'], required: 'any:permission', expected: true },
        { scopes: ['admin:all'], required: 'analytics:write', expected: true },
        { scopes: [], required: 'analytics:read', expected: false },
      ];

      tests.forEach(test => {
        const result = apiKeyService.hasScope(test.scopes, test.required);
        expect(result).toBe(test.expected);
      });
    });

    it('should validate IP restrictions', () => {
      const tests = [
        { restrictions: [], clientIp: '192.168.1.1', expected: true },
        { restrictions: ['192.168.1.1'], clientIp: '192.168.1.1', expected: true },
        { restrictions: ['192.168.1.1', '10.0.0.1'], clientIp: '10.0.0.1', expected: true },
        { restrictions: ['192.168.1.1'], clientIp: '192.168.1.2', expected: false },
      ];

      tests.forEach(test => {
        const result = apiKeyService.validateIpRestriction(test.restrictions, test.clientIp);
        expect(result).toBe(test.expected);
      });
    });
  });
});

// Force Jest to exit after tests complete
afterAll(() => {
  setTimeout(() => process.exit(0), 1000);
});