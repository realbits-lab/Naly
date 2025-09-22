import { describe, it, expect, afterAll } from '@jest/globals';
import { apiKeyService } from '@/lib/services/api-key-service';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/schema/api-keys';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('API Key Service - Basic Tests', () => {
  const testUserId = crypto.randomUUID();
  const createdKeyIds: string[] = [];

  afterAll(async () => {
    // Clean up all created keys
    for (const keyId of createdKeyIds) {
      try {
        await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Ensure database connection is closed
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should create and validate an API key', async () => {
    // Create a new API key
    const result = await apiKeyService.createApiKey({
      userId: testUserId,
      name: 'Test API Key',
      scopes: ['analytics:read'],
    });

    expect(result).toHaveProperty('apiKey');
    expect(result).toHaveProperty('keyId');
    expect(result.apiKey).toMatch(/^naly_(test|live)_[a-f0-9]{64}$/);

    createdKeyIds.push(result.keyId);

    // Validate the created key
    const validated = await apiKeyService.validateApiKey(result.apiKey);
    expect(validated).not.toBeNull();
    expect(validated?.id).toBe(result.keyId);
  });

  it('should check scopes correctly', () => {
    expect(apiKeyService.hasScope(['analytics:read'], 'analytics:read')).toBe(true);
    expect(apiKeyService.hasScope(['analytics:read'], 'analytics:write')).toBe(false);
    expect(apiKeyService.hasScope(['*'], 'anything')).toBe(true);
  });

  it('should validate IP restrictions', () => {
    expect(apiKeyService.validateIpRestriction([], '192.168.1.1')).toBe(true);
    expect(apiKeyService.validateIpRestriction(['192.168.1.1'], '192.168.1.1')).toBe(true);
    expect(apiKeyService.validateIpRestriction(['192.168.1.1'], '192.168.1.2')).toBe(false);
  });
});