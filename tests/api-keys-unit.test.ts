import { describe, it, expect } from '@jest/globals';
import { apiKeyService } from '@/lib/services/api-key-service';

describe('API Key Service - Unit Tests', () => {
  describe('Scope Validation', () => {
    it('should correctly validate exact scope matches', () => {
      expect(apiKeyService.hasScope(['analytics:read'], 'analytics:read')).toBe(true);
      expect(apiKeyService.hasScope(['analytics:read', 'predictions:read'], 'analytics:read')).toBe(true);
      expect(apiKeyService.hasScope(['analytics:read'], 'analytics:write')).toBe(false);
    });

    it('should handle wildcard scopes', () => {
      expect(apiKeyService.hasScope(['*'], 'analytics:read')).toBe(true);
      expect(apiKeyService.hasScope(['*'], 'predictions:write')).toBe(true);
      expect(apiKeyService.hasScope(['*'], 'any:permission')).toBe(true);
    });

    it('should handle admin scopes', () => {
      expect(apiKeyService.hasScope(['admin:all'], 'analytics:read')).toBe(true);
      expect(apiKeyService.hasScope(['admin:all'], 'user:write')).toBe(true);
      expect(apiKeyService.hasScope(['admin:all'], 'events:write')).toBe(true);
    });

    it('should handle empty scopes', () => {
      expect(apiKeyService.hasScope([], 'analytics:read')).toBe(false);
      expect(apiKeyService.hasScope([''], 'analytics:read')).toBe(false);
    });
  });

  describe('IP Restriction Validation', () => {
    it('should allow any IP when no restrictions are set', () => {
      expect(apiKeyService.validateIpRestriction([], '192.168.1.1')).toBe(true);
      expect(apiKeyService.validateIpRestriction([], '10.0.0.1')).toBe(true);
      expect(apiKeyService.validateIpRestriction([], 'any.ip.address')).toBe(true);
    });

    it('should enforce IP whitelist when set', () => {
      const whitelist = ['192.168.1.1', '192.168.1.2'];

      expect(apiKeyService.validateIpRestriction(whitelist, '192.168.1.1')).toBe(true);
      expect(apiKeyService.validateIpRestriction(whitelist, '192.168.1.2')).toBe(true);
      expect(apiKeyService.validateIpRestriction(whitelist, '192.168.1.3')).toBe(false);
      expect(apiKeyService.validateIpRestriction(whitelist, '10.0.0.1')).toBe(false);
    });

    it('should handle single IP restriction', () => {
      expect(apiKeyService.validateIpRestriction(['192.168.1.1'], '192.168.1.1')).toBe(true);
      expect(apiKeyService.validateIpRestriction(['192.168.1.1'], '192.168.1.2')).toBe(false);
    });
  });

  describe('API Scopes Configuration', () => {
    it('should have all required scope definitions', () => {
      const requiredScopes = [
        'analytics:read',
        'analytics:write',
        'predictions:read',
        'predictions:write',
        'narratives:read',
        'narratives:write',
        'events:read',
        'events:write',
        'user:read',
        'user:write',
        'admin:all',
        '*',
      ];

      const API_SCOPES = apiKeyService.API_SCOPES || {};
      const definedScopes = Object.keys(API_SCOPES);

      requiredScopes.forEach(scope => {
        expect(definedScopes).toContain(scope);
      });
    });

    it('should have proper scope descriptions', () => {
      const API_SCOPES = apiKeyService.API_SCOPES || {};

      Object.entries(API_SCOPES).forEach(([scope, description]) => {
        expect(description).toBeTruthy();
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(5);
      });
    });
  });
});