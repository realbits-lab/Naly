# Naly API Documentation

## Overview

The Naly API provides programmatic access to market analytics, predictions, narratives, and more. All API requests require authentication using an API key.

## Authentication

All API requests must include your API key in the Authorization header:

```
Authorization: Bearer naly_live_xxxxxxxxxxxxx
```

## Base URL

```
https://api.naly.com/api/v1
```

For local development:
```
http://localhost:4000/api/v1
```

## Rate Limiting

API requests are rate-limited based on your API key configuration. Default limits:
- 100 requests per minute for standard keys
- Custom limits available for enterprise clients

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Available Scopes

API keys can be configured with specific scopes to limit access:

- `analytics:read` - Read market analytics data
- `analytics:write` - Create and update analytics
- `predictions:read` - Read predictions and forecasts
- `predictions:write` - Create predictions
- `narratives:read` - Read narrative content
- `narratives:write` - Create and edit narratives
- `events:read` - Read market events
- `events:write` - Create market events
- `user:read` - Read user profile data
- `user:write` - Update user profile
- `*` - Full access to all resources

## Endpoints

### Analytics

#### GET /analytics
Get market analytics data.

**Query Parameters:**
- `ticker` (string, optional): Filter by ticker symbol
- `startDate` (string, optional): Start date (ISO 8601)
- `endDate` (string, optional): End date (ISO 8601)
- `limit` (number, optional): Number of results (1-100, default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Required Scope:** `analytics:read`

**Example Request:**
```bash
curl -H "Authorization: Bearer naly_live_xxxxx" \
  "https://api.naly.com/api/v1/analytics?ticker=AAPL&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "ticker": "AAPL",
      "timestamp": "2025-01-20T10:00:00Z",
      "price": 195.50,
      "volume": 50000000,
      "metrics": {}
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Predictions

#### GET /predictions
Get market predictions.

**Query Parameters:**
- `ticker` (string, optional): Filter by ticker symbol
- `confidence` (number, optional): Minimum confidence level (0-100)
- `horizon` (string, optional): Time horizon (short, medium, long)
- `startDate` (string, optional): Start date
- `endDate` (string, optional): End date
- `limit` (number, optional): Number of results (1-100, default: 20)
- `offset` (number, optional): Pagination offset

**Required Scope:** `predictions:read`

#### POST /predictions
Create a new prediction.

**Request Body:**
```json
{
  "ticker": "AAPL",
  "prediction": {
    "direction": "up",
    "confidence": 75,
    "targetPrice": 200,
    "timeframe": "30 days"
  },
  "analysis": {
    "reasoning": "Strong earnings expected",
    "factors": ["earnings", "market sentiment"],
    "risks": ["regulatory concerns"]
  }
}
```

**Required Scope:** `predictions:write`

### Narratives

#### GET /narratives
Get narrative content.

**Query Parameters:**
- `ticker` (string, optional): Filter by ticker
- `type` (string, optional): Narrative type (daily, weekly, monthly, custom)
- `search` (string, optional): Search in title and content
- `published` (boolean, optional): Filter by published status
- `limit` (number, optional): Number of results
- `offset` (number, optional): Pagination offset

**Required Scope:** `narratives:read`

#### POST /narratives
Create a new narrative.

**Request Body:**
```json
{
  "title": "Market Analysis for Q1 2025",
  "content": "Detailed analysis content...",
  "ticker": "AAPL",
  "type": "monthly",
  "summary": "Brief summary",
  "tags": ["analysis", "quarterly"],
  "published": false
}
```

**Required Scope:** `narratives:write`

### Events

#### GET /events
Get market events.

**Query Parameters:**
- `ticker` (string, optional): Filter by ticker
- `eventType` (string, optional): Event type
- `severity` (string, optional): Event severity (low, medium, high, critical)
- `startDate` (string, optional): Start date
- `endDate` (string, optional): End date
- `grouped` (boolean, optional): Group results by ticker
- `limit` (number, optional): Number of results
- `offset` (number, optional): Pagination offset

**Required Scope:** `events:read`

#### POST /events
Create a new event.

**Request Body:**
```json
{
  "ticker": "AAPL",
  "eventType": "earnings",
  "title": "Q4 Earnings Beat Expectations",
  "description": "Apple reported strong Q4 earnings...",
  "severity": "high",
  "impact": {
    "priceChange": 5.2,
    "volumeChange": 150,
    "sentiment": "positive"
  },
  "source": "earnings_report"
}
```

**Required Scope:** `events:write`

### User Profile

#### GET /user/profile
Get current user's profile information.

**Required Scope:** `user:read`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "stats": {
      "totalPredictions": 42,
      "accuracyRate": 78.5,
      "totalNarratives": 15
    }
  }
}
```

#### PATCH /user/profile
Update user profile.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "bio": "Financial analyst",
  "preferences": {
    "notifications": true,
    "emailAlerts": false,
    "theme": "dark"
  }
}
```

**Required Scope:** `user:write`

## Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": "Error message",
  "details": {},
  "code": "ERROR_CODE"
}
```

## SDKs and Libraries

Coming soon:
- Node.js/TypeScript SDK
- Python SDK
- Go SDK

## Webhooks

Coming soon: Real-time event notifications via webhooks.

## Support

For API support, contact:
- Email: api-support@naly.com
- Documentation: https://docs.naly.com
- Status Page: https://status.naly.com