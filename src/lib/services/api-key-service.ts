import { db } from '@/lib/db';
import { apiKeys, apiKeyLogs, apiKeyUsageStats, NewApiKey, ApiKey } from '@/lib/schema/api-keys';
import { and, eq, isNull, gte, or, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const API_SCOPES = {
  'analytics:read': 'Read market analytics data',
  'analytics:write': 'Create and update analytics',
  'predictions:read': 'Read predictions and forecasts',
  'predictions:write': 'Create predictions',
  'narratives:read': 'Read narrative content',
  'narratives:write': 'Create and edit narratives',
  'community:read': 'Read community content',
  'community:write': 'Post to community',
  'portfolio:read': 'Read portfolio data',
  'portfolio:write': 'Manage portfolio',
  'events:read': 'Read market events',
  'events:write': 'Create market events',
  'user:read': 'Read user profile data',
  'user:write': 'Update user profile',
  'admin:all': 'Full administrative access',
  '*': 'Full access to all resources',
} as const;

export type ApiScope = keyof typeof API_SCOPES;

interface CreateApiKeyParams {
  userId: string;
  name: string;
  scopes: ApiScope[];
  rateLimit?: number;
  ipRestrictions?: string[];
  expiresInDays?: number;
  metadata?: Record<string, any>;
}

interface ApiKeyResponse {
  apiKey: string;
  keyId: string;
  name: string;
  lastFourChars: string;
  expiresAt: Date | null;
  scopes: string[];
}

export class ApiKeyService {
  private generateApiKey(): string {
    const prefix = process.env.NODE_ENV === 'production' ? 'naly_live' : 'naly_test';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${randomBytes}`;
  }

  private hashApiKey(apiKey: string): string {
    return crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');
  }

  async createApiKey(params: CreateApiKeyParams): Promise<ApiKeyResponse> {
    const {
      userId,
      name,
      scopes,
      rateLimit = 100,
      ipRestrictions = [],
      expiresInDays = 90,
      metadata = {},
    } = params;

    // Generate the API key
    const apiKey = this.generateApiKey();
    const keyHash = this.hashApiKey(apiKey);
    const lastFourChars = apiKey.slice(-4);

    // Calculate expiration date
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Store in database
    const [newKey] = await db.insert(apiKeys).values({
      userId,
      name,
      keyHash,
      lastFourChars,
      scopes: scopes as string[],
      rateLimit,
      ipRestrictions,
      metadata,
      expiresAt,
    }).returning();

    // Return the API key (only time it's visible in plain text)
    return {
      apiKey,
      keyId: newKey.id,
      name: newKey.name,
      lastFourChars,
      expiresAt,
      scopes: scopes as string[],
    };
  }

  async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    const keyHash = this.hashApiKey(apiKey);

    const keyRecord = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt),
        or(
          isNull(apiKeys.expiresAt),
          gte(apiKeys.expiresAt, new Date())
        )
      ),
    });

    if (keyRecord) {
      // Update last used timestamp
      await db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id));
    }

    return keyRecord || null;
  }

  async getUserApiKeys(userId: string) {
    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, userId),
      orderBy: [desc(apiKeys.createdAt)],
    });

    // Don't return the actual key hashes
    return keys.map(key => ({
      id: key.id,
      name: key.name,
      lastFourChars: key.lastFourChars,
      scopes: key.scopes,
      rateLimit: key.rateLimit,
      ipRestrictions: key.ipRestrictions,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      revokedAt: key.revokedAt,
      isActive: !key.revokedAt && (!key.expiresAt || key.expiresAt > new Date()),
    }));
  }

  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await db.update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, userId),
        isNull(apiKeys.revokedAt)
      ))
      .returning();

    return result.length > 0;
  }

  async rotateApiKey(oldKeyId: string, userId: string): Promise<ApiKeyResponse | null> {
    // Get the old key details
    const oldKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, oldKeyId),
        eq(apiKeys.userId, userId),
        isNull(apiKeys.revokedAt)
      ),
    });

    if (!oldKey) {
      return null;
    }

    // Create a new key with the same settings
    const newKey = await this.createApiKey({
      userId,
      name: `${oldKey.name} (rotated)`,
      scopes: oldKey.scopes as ApiScope[],
      rateLimit: oldKey.rateLimit || 100,
      ipRestrictions: oldKey.ipRestrictions as string[],
      metadata: oldKey.metadata as Record<string, any>,
    });

    // Revoke the old key
    await this.revokeApiKey(oldKeyId, userId);

    return newKey;
  }

  async logApiKeyUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress?: string,
    userAgent?: string,
    requestBody?: any,
    errorMessage?: string
  ) {
    await db.insert(apiKeyLogs).values({
      apiKeyId,
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
      userAgent,
      requestBody,
      errorMessage,
    });

    // Update usage statistics
    await this.updateUsageStats(apiKeyId, endpoint, statusCode, responseTime);
  }

  private async updateUsageStats(
    apiKeyId: string,
    endpoint: string,
    statusCode: number,
    responseTime: number
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isError = statusCode >= 400;

    // Try to update existing stats for today
    const existingStats = await db.query.apiKeyUsageStats.findFirst({
      where: and(
        eq(apiKeyUsageStats.apiKeyId, apiKeyId),
        eq(apiKeyUsageStats.date, today),
        eq(apiKeyUsageStats.endpoint, endpoint)
      ),
    });

    if (existingStats) {
      await db.update(apiKeyUsageStats)
        .set({
          requestCount: sql`${apiKeyUsageStats.requestCount} + 1`,
          errorCount: isError ? sql`${apiKeyUsageStats.errorCount} + 1` : apiKeyUsageStats.errorCount,
          avgResponseTime: sql`(${apiKeyUsageStats.avgResponseTime} * ${apiKeyUsageStats.requestCount} + ${responseTime}) / (${apiKeyUsageStats.requestCount} + 1)`,
          updatedAt: new Date(),
        })
        .where(eq(apiKeyUsageStats.id, existingStats.id));
    } else {
      await db.insert(apiKeyUsageStats).values({
        apiKeyId,
        date: today,
        endpoint,
        requestCount: 1,
        errorCount: isError ? 1 : 0,
        avgResponseTime: responseTime,
      });
    }
  }

  async getApiKeyUsageStats(apiKeyId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = await db.query.apiKeyUsageStats.findMany({
      where: and(
        eq(apiKeyUsageStats.apiKeyId, apiKeyId),
        gte(apiKeyUsageStats.date, startDate)
      ),
      orderBy: [desc(apiKeyUsageStats.date)],
    });

    return stats;
  }

  async getApiKeyLogs(apiKeyId: string, limit: number = 100) {
    const logs = await db.query.apiKeyLogs.findMany({
      where: eq(apiKeyLogs.apiKeyId, apiKeyId),
      orderBy: [desc(apiKeyLogs.timestamp)],
      limit,
    });

    return logs;
  }

  hasScope(userScopes: string[], requiredScope: string): boolean {
    return userScopes.includes('*') ||
           userScopes.includes('admin:all') ||
           userScopes.includes(requiredScope);
  }

  validateIpRestriction(ipRestrictions: string[], clientIp: string): boolean {
    if (!ipRestrictions || ipRestrictions.length === 0) {
      return true; // No restrictions
    }

    return ipRestrictions.includes(clientIp);
  }
}

// Create singleton instance
const apiKeyServiceInstance = new ApiKeyService();

// Add API_SCOPES to the instance for testing
(apiKeyServiceInstance as any).API_SCOPES = API_SCOPES;

// Export singleton instance
export const apiKeyService = apiKeyServiceInstance;