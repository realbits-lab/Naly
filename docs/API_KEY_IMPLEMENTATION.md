# API Key Management System - Implementation Guide

## Overview

This document provides a comprehensive overview of the API key management system implemented in Naly, including setup instructions, architecture details, and usage guidelines.

## Features

### Core Features
- ✅ **Secure API Key Generation**: Cryptographically secure key generation using Node.js crypto module
- ✅ **SHA-256 Hashing**: API keys are never stored in plain text
- ✅ **Granular Scopes**: Fine-grained permission control with 14+ predefined scopes
- ✅ **Rate Limiting**: Configurable per-key rate limits using Upstash Redis
- ✅ **IP Restrictions**: Optional IP whitelisting for enhanced security
- ✅ **Key Rotation**: Seamless key rotation with automatic revocation
- ✅ **Usage Analytics**: Detailed tracking of API usage with statistics
- ✅ **Auto-expiration**: Configurable expiration periods (default: 90 days)

### Management Features
- ✅ **Dashboard UI**: Full-featured management interface
- ✅ **Real-time Monitoring**: View usage statistics and logs
- ✅ **Endpoint Analytics**: Performance metrics per endpoint
- ✅ **Error Tracking**: Automatic error logging and reporting

## Architecture

### Database Schema

```
api_keys
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key)
├── name (VARCHAR)
├── key_hash (VARCHAR, SHA-256)
├── last_four_chars (VARCHAR)
├── scopes (JSONB)
├── rate_limit (INTEGER)
├── ip_restrictions (JSONB)
├── metadata (JSONB)
├── expires_at (TIMESTAMP)
├── last_used_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── revoked_at (TIMESTAMP)

api_key_logs
├── id (UUID, Primary Key)
├── api_key_id (UUID, Foreign Key)
├── endpoint (VARCHAR)
├── method (VARCHAR)
├── status_code (INTEGER)
├── response_time (INTEGER)
├── ip_address (VARCHAR)
├── user_agent (TEXT)
├── request_body (JSONB)
├── error_message (TEXT)
└── timestamp (TIMESTAMP)

api_key_usage_stats
├── id (UUID, Primary Key)
├── api_key_id (UUID, Foreign Key)
├── date (TIMESTAMP)
├── endpoint (VARCHAR)
├── request_count (INTEGER)
├── error_count (INTEGER)
├── avg_response_time (INTEGER)
├── unique_ips (INTEGER)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Components Structure

```
src/
├── lib/
│   ├── schema/
│   │   └── api-keys.ts           # Database schema definitions
│   ├── services/
│   │   ├── api-key-service.ts    # Core API key operations
│   │   └── rate-limiter.ts       # Rate limiting service
│   └── middleware/
│       └── api-auth.ts           # Authentication middleware
├── app/
│   ├── api/
│   │   ├── account/
│   │   │   └── api-keys/         # Management endpoints
│   │   └── v1/                   # Protected API endpoints
│   │       ├── analytics/
│   │       ├── predictions/
│   │       ├── narratives/
│   │       ├── events/
│   │       └── user/
│   └── (dashboard)/
│       └── settings/
│           └── api-keys/          # Dashboard page
└── components/
    └── api-keys/                  # UI components
        ├── api-keys-list.tsx
        ├── create-api-key-dialog.tsx
        └── api-key-details-dialog.tsx
```

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
# Upstash Redis (Required for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional: API configuration
API_KEY_SALT=your-random-salt
ENABLE_API_KEYS=true
ENABLE_RATE_LIMITING=true
```

### 2. Database Migration

Run the migration to create the necessary tables:

```bash
# Using the SQL migration file
psql $DATABASE_URL < migrations/add-api-keys.sql

# Or using Drizzle
pnpm db:push
```

### 3. Install Dependencies

The system requires:
- `@upstash/ratelimit` and `@upstash/redis` for rate limiting
- Other dependencies are already part of the Next.js setup

## Usage Guide

### For Developers (Using the API)

#### 1. Create an API Key

Navigate to Settings → API Keys in the dashboard and create a new key with the required scopes.

#### 2. Make API Requests

Include the API key in the Authorization header:

```bash
curl -H "Authorization: Bearer naly_live_xxxxxxxxxxxxx" \
  http://localhost:4000/api/v1/analytics
```

#### 3. Handle Rate Limits

Monitor rate limit headers in responses:
- `X-RateLimit-Limit`: Total allowed requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

### For Administrators

#### Managing API Keys

1. **View All Keys**: Dashboard shows all active and revoked keys
2. **Monitor Usage**: Click on any key to view detailed statistics
3. **Rotate Keys**: Use the rotate button for security updates
4. **Revoke Access**: Immediately revoke compromised keys

#### Available Scopes

| Scope | Description |
|-------|-------------|
| `analytics:read` | Read market analytics data |
| `analytics:write` | Create/update analytics |
| `predictions:read` | Read predictions |
| `predictions:write` | Create predictions |
| `narratives:read` | Read narratives |
| `narratives:write` | Create/edit narratives |
| `events:read` | Read market events |
| `events:write` | Create events |
| `user:read` | Read user profile |
| `user:write` | Update user profile |
| `admin:all` | Administrative access |
| `*` | Full access to all resources |

## Security Best Practices

### Implementation Security

1. **Never Store Plain Keys**: Only SHA-256 hashes are stored
2. **One-Time Display**: Keys shown only once at creation
3. **Automatic Expiration**: Default 90-day expiration
4. **IP Whitelisting**: Optional IP restrictions
5. **Rate Limiting**: Prevents abuse and DDoS
6. **Audit Logging**: Complete usage tracking

### User Guidelines

1. **Secure Storage**: Store keys in environment variables or secrets manager
2. **Regular Rotation**: Rotate keys every 30-90 days
3. **Minimal Scopes**: Grant only necessary permissions
4. **Monitor Usage**: Regularly review API key activity
5. **Immediate Revocation**: Revoke compromised keys immediately

## API Endpoints

### Management Endpoints (User Authentication Required)

- `GET /api/account/api-keys` - List user's API keys
- `POST /api/account/api-keys` - Create new API key
- `GET /api/account/api-keys/[id]` - Get key details and stats
- `DELETE /api/account/api-keys/[id]` - Revoke API key
- `POST /api/account/api-keys/[id]/rotate` - Rotate API key
- `GET /api/account/api-keys/[id]/logs` - View usage logs

### Protected API Endpoints (API Key Required)

- `GET /api/v1/analytics` - Market analytics data
- `GET/POST /api/v1/predictions` - Predictions
- `GET/POST /api/v1/narratives` - Narratives
- `GET/POST /api/v1/events` - Market events
- `GET/PATCH /api/v1/user/profile` - User profile

## Testing

Run the test suite:

```bash
# Run all API key tests
pnpm test tests/api-keys.test.ts

# Run with coverage
pnpm test:coverage tests/api-keys.test.ts
```

## Monitoring and Debugging

### Viewing Logs

API usage is automatically logged. View logs through:
1. Dashboard UI (per-key logs)
2. Database queries (api_key_logs table)
3. Upstash Redis dashboard (rate limit data)

### Common Issues

#### Rate Limit Exceeded
- Check `X-RateLimit-Remaining` header
- Wait for reset or increase limit
- Use `Retry-After` header for wait time

#### Invalid API Key
- Verify key hasn't expired
- Check if key is revoked
- Ensure correct environment (test/live)

#### Insufficient Permissions
- Review assigned scopes
- Request additional permissions if needed

## Advanced Configuration

### Custom Rate Limits

Configure per-key rate limits:
```typescript
await apiKeyService.createApiKey({
  userId,
  name: 'High-volume Key',
  scopes: ['analytics:read'],
  rateLimit: 1000, // 1000 requests per minute
});
```

### IP Restrictions

Limit key usage to specific IPs:
```typescript
await apiKeyService.createApiKey({
  userId,
  name: 'Server Key',
  scopes: ['*'],
  ipRestrictions: ['203.0.113.0', '203.0.113.1'],
});
```

### Custom Metadata

Store additional information:
```typescript
await apiKeyService.createApiKey({
  userId,
  name: 'Integration Key',
  scopes: ['analytics:read'],
  metadata: {
    environment: 'production',
    service: 'data-pipeline',
    team: 'analytics',
  },
});
```

## Future Enhancements

Planned improvements:
- [ ] Webhook support for real-time notifications
- [ ] OAuth 2.0 flow for third-party apps
- [ ] SDK libraries (Node.js, Python, Go)
- [ ] GraphQL API support
- [ ] Advanced analytics dashboard
- [ ] Automatic key rotation policies
- [ ] Team/organization API keys
- [ ] API versioning support

## Support

For issues or questions:
- Check the [API Documentation](/docs/API.md)
- Review test files for examples
- Contact the development team

## License

This implementation is part of the Naly platform and follows the project's licensing terms.