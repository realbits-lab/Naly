import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { apiKeyService } from '@/lib/services/api-key-service';
import { db } from '@/lib/db';
import { apiKeys, apiKeyLogs, apiKeyUsageStats } from '@/lib/schema/api-keys';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('API Key Service', () => {
  let testUserId: string;
  let createdKeyId: string;

  beforeAll(() => {
    // Generate a test user ID
    testUserId = crypto.randomUUID();
  });

  afterAll(async () => {
    // Clean up test data
    if (createdKeyId) {
      await db.delete(apiKeyLogs).where(eq(apiKeyLogs.apiKeyId, createdKeyId));
      await db.delete(apiKeyUsageStats).where(eq(apiKeyUsageStats.apiKeyId, createdKeyId));
      await db.delete(apiKeys).where(eq(apiKeys.id, createdKeyId));
    }
  });

  describe('createApiKey', () => {
    it('should create a new API key with default settings', async () => {
      const result = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'Test API Key',
        scopes: ['analytics:read', 'predictions:read'],
      });

      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('keyId');
      expect(result).toHaveProperty('lastFourChars');
      expect(result.apiKey).toMatch(/^naly_(test|live)_[a-f0-9]{64}$/);
      expect(result.name).toBe('Test API Key');
      expect(result.scopes).toEqual(['analytics:read', 'predictions:read']);

      createdKeyId = result.keyId;
    });

    it('should create API key with custom rate limit', async () => {
      const result = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'High Rate API Key',
        scopes: ['*'],
        rateLimit: 1000,
      });

      expect(result).toHaveProperty('apiKey');

      // Verify in database
      const dbKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, result.keyId),
      });

      expect(dbKey?.rateLimit).toBe(1000);

      // Clean up
      await db.delete(apiKeys).where(eq(apiKeys.id, result.keyId));
    });

    it('should create API key with IP restrictions', async () => {
      const ipRestrictions = ['192.168.1.1', '10.0.0.0'];

      const result = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'IP Restricted Key',
        scopes: ['analytics:read'],
        ipRestrictions,
      });

      const dbKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, result.keyId),
      });

      expect(dbKey?.ipRestrictions).toEqual(ipRestrictions);

      // Clean up
      await db.delete(apiKeys).where(eq(apiKeys.id, result.keyId));
    });
  });

  describe('validateApiKey', () => {
    let validApiKey: string;
    let validKeyId: string;

    beforeAll(async () => {
      const result = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'Validation Test Key',
        scopes: ['analytics:read'],
      });
      validApiKey = result.apiKey;
      validKeyId = result.keyId;
    });

    afterAll(async () => {
      await db.delete(apiKeys).where(eq(apiKeys.id, validKeyId));
    });

    it('should validate a valid API key', async () => {
      const result = await apiKeyService.validateApiKey(validApiKey);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(validKeyId);
      expect(result?.name).toBe('Validation Test Key');
    });

    it('should return null for invalid API key', async () => {
      const invalidKey = 'naly_test_invalid_key_12345';
      const result = await apiKeyService.validateApiKey(invalidKey);

      expect(result).toBeNull();
    });

    it('should update lastUsedAt on validation', async () => {
      const beforeValidation = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, validKeyId),
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      await apiKeyService.validateApiKey(validApiKey);

      const afterValidation = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, validKeyId),
      });

      expect(afterValidation?.lastUsedAt).not.toEqual(beforeValidation?.lastUsedAt);
    });
  });

  describe('revokeApiKey', () => {
    let keyToRevoke: string;

    beforeAll(async () => {
      const result = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'Key to Revoke',
        scopes: ['analytics:read'],
      });
      keyToRevoke = result.keyId;
    });

    it('should revoke an API key', async () => {
      const result = await apiKeyService.revokeApiKey(keyToRevoke, testUserId);

      expect(result).toBe(true);

      const revokedKey = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, keyToRevoke),
      });

      expect(revokedKey?.revokedAt).not.toBeNull();
    });

    it('should not revoke key for wrong user', async () => {
      const differentUserId = crypto.randomUUID();
      const result = await apiKeyService.revokeApiKey(keyToRevoke, differentUserId);

      expect(result).toBe(false);
    });
  });

  describe('rotateApiKey', () => {
    let oldKeyId: string;
    let oldApiKey: string;

    beforeAll(async () => {
      const result = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'Key to Rotate',
        scopes: ['analytics:read', 'predictions:read'],
        rateLimit: 200,
      });
      oldKeyId = result.keyId;
      oldApiKey = result.apiKey;
    });

    it('should rotate an API key', async () => {
      const newKey = await apiKeyService.rotateApiKey(oldKeyId, testUserId);

      expect(newKey).not.toBeNull();
      expect(newKey?.apiKey).not.toBe(oldApiKey);
      expect(newKey?.name).toContain('(rotated)');
      expect(newKey?.scopes).toEqual(['analytics:read', 'predictions:read']);

      // Verify old key is revoked
      const oldKeyRecord = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, oldKeyId),
      });

      expect(oldKeyRecord?.revokedAt).not.toBeNull();

      // Clean up new key
      if (newKey) {
        await db.delete(apiKeys).where(eq(apiKeys.id, newKey.keyId));
      }
    });
  });

  describe('hasScope', () => {
    it('should return true for exact scope match', () => {
      const userScopes = ['analytics:read', 'predictions:read'];
      const result = apiKeyService.hasScope(userScopes, 'analytics:read');

      expect(result).toBe(true);
    });

    it('should return true for wildcard scope', () => {
      const userScopes = ['*'];
      const result = apiKeyService.hasScope(userScopes, 'analytics:read');

      expect(result).toBe(true);
    });

    it('should return true for admin scope', () => {
      const userScopes = ['admin:all'];
      const result = apiKeyService.hasScope(userScopes, 'analytics:write');

      expect(result).toBe(true);
    });

    it('should return false for missing scope', () => {
      const userScopes = ['analytics:read'];
      const result = apiKeyService.hasScope(userScopes, 'analytics:write');

      expect(result).toBe(false);
    });
  });

  describe('validateIpRestriction', () => {
    it('should allow any IP when no restrictions', () => {
      const result = apiKeyService.validateIpRestriction([], '192.168.1.100');
      expect(result).toBe(true);
    });

    it('should allow whitelisted IP', () => {
      const restrictions = ['192.168.1.1', '10.0.0.1'];
      const result = apiKeyService.validateIpRestriction(restrictions, '192.168.1.1');
      expect(result).toBe(true);
    });

    it('should block non-whitelisted IP', () => {
      const restrictions = ['192.168.1.1', '10.0.0.1'];
      const result = apiKeyService.validateIpRestriction(restrictions, '192.168.1.100');
      expect(result).toBe(false);
    });
  });

  describe('logApiKeyUsage', () => {
    let keyForLogging: string;

    beforeAll(async () => {
      const result = await apiKeyService.createApiKey({
        userId: testUserId,
        name: 'Logging Test Key',
        scopes: ['analytics:read'],
      });
      keyForLogging = result.keyId;
    });

    afterAll(async () => {
      await db.delete(apiKeyLogs).where(eq(apiKeyLogs.apiKeyId, keyForLogging));
      await db.delete(apiKeyUsageStats).where(eq(apiKeyUsageStats.apiKeyId, keyForLogging));
      await db.delete(apiKeys).where(eq(apiKeys.id, keyForLogging));
    });

    it('should log API key usage', async () => {
      await apiKeyService.logApiKeyUsage(
        keyForLogging,
        '/api/v1/analytics',
        'GET',
        200,
        150,
        '192.168.1.1',
        'Mozilla/5.0',
        null,
        undefined
      );

      const logs = await apiKeyService.getApiKeyLogs(keyForLogging, 10);

      expect(logs).toHaveLength(1);
      expect(logs[0].endpoint).toBe('/api/v1/analytics');
      expect(logs[0].method).toBe('GET');
      expect(logs[0].statusCode).toBe(200);
      expect(logs[0].responseTime).toBe(150);
    });

    it('should update usage statistics', async () => {
      // Log multiple requests
      await apiKeyService.logApiKeyUsage(
        keyForLogging,
        '/api/v1/predictions',
        'GET',
        200,
        100,
        '192.168.1.1'
      );

      await apiKeyService.logApiKeyUsage(
        keyForLogging,
        '/api/v1/predictions',
        'GET',
        404,
        50,
        '192.168.1.2'
      );

      const stats = await apiKeyService.getApiKeyUsageStats(keyForLogging, 1);

      expect(stats.length).toBeGreaterThan(0);

      const todayStats = stats.find(s => s.endpoint === '/api/v1/predictions');
      expect(todayStats).toBeDefined();
      expect(todayStats?.requestCount).toBe(2);
      expect(todayStats?.errorCount).toBe(1);
    });
  });
});