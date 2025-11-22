# Analytics Dashboard Guide

Comprehensive monitoring and reporting for like and reply engagement metrics.

## Overview

The Analytics Dashboard provides real-time insights into user engagement with your content, including:
- Like and reply statistics
- Time series data with interactive graphs
- User type distribution (anonymous vs authenticated)
- Exportable reports
- Period-based analysis

## Accessing the Dashboard

**Location**: `/admin/analytics`

**Navigation**: Admin Panel → Analytics (in sidebar)

**Requirements**: Must be logged in as authenticated admin (not anonymous)

## Features

### 1. Overview Statistics

Four key metric cards at the top of the dashboard:

**Total Likes**
- All-time like count
- Period-specific count displayed in description
- Pink heart icon
- Trend indicator (coming soon)

**Total Replies**
- All-time reply count
- Period-specific count displayed in description
- Blue message icon

**Total Users**
- All registered users (including anonymous)
- Shows number of anonymous users
- Purple users icon

**Authenticated Users**
- Users with full accounts
- Percentage of total users
- Green checkmark icon

### 2. Period Selection

Filter data by time period:
- **Last 7 Days**: Week-over-week trends
- **Last 30 Days**: Monthly analysis
- **Last 90 Days**: Quarterly review
- **All Time**: Complete history

Click any period button to update all charts and statistics.

### 3. Engagement Over Time Chart

**Line chart showing:**
- Pink line: Likes per day
- Blue line: Replies per day
- X-axis: Dates
- Y-axis: Count

**Features:**
- Hover for exact counts
- Interactive legend
- Responsive design
- Smooth animations

**Use cases:**
- Identify trending days
- Spot engagement patterns
- Compare likes vs replies
- Track growth over time

### 4. User Type Distribution

**Two pie charts showing:**

**Likes by User Type:**
- Orange: Anonymous users
- Green: Authenticated users
- Percentage breakdown

**Replies by User Type:**
- Same color scheme
- Shows engagement split
- Helps measure anonymous conversion

### 5. Engagement Breakdown

Detailed breakdown table showing:

**Likes:**
- Anonymous user count (orange)
- Authenticated user count (green)

**Replies:**
- Anonymous user count (orange)
- Authenticated user count (green)

## Using the Dashboard

### Basic Workflow

1. **Select Period**: Choose your analysis timeframe
2. **Review Overview**: Check key metrics at a glance
3. **Analyze Trends**: Examine the time series chart
4. **Compare User Types**: Review pie charts for distribution
5. **Export Report**: Download data for further analysis

### Export Reports

Click the **"Export Report"** button to download a JSON file containing:
- Generation timestamp
- Selected period details
- All overview statistics
- Engagement breakdown
- Time series data

**File format**: `analytics-report-{period}-{date}.json`

**Use cases:**
- Share with stakeholders
- Import into other analytics tools
- Archive historical data
- Create custom visualizations

### Refresh Data

Click the **"Refresh"** button to:
- Reload latest data
- Update all charts
- Sync with database
- Get real-time counts

Auto-refresh coming in future update.

## API Endpoint

### GET /api/analytics/stats

Fetches all analytics data for the admin dashboard.

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, or `all` (default: `7d`)

**Authorization**: Requires authenticated admin session

**Response Schema:**
```json
{
  "overview": {
    "totalLikes": 1250,
    "totalReplies": 843,
    "totalUsers": 567,
    "anonymousUsers": 412,
    "authenticatedUsers": 155
  },
  "period": {
    "period": "7d",
    "startDate": "2025-01-14T00:00:00Z",
    "endDate": "2025-01-21T00:00:00Z",
    "likes": 127,
    "replies": 89
  },
  "timeSeries": {
    "dailyLikes": [
      { "date": "2025-01-14", "count": 18 },
      { "date": "2025-01-15", "count": 23 }
    ],
    "dailyReplies": [
      { "date": "2025-01-14", "count": 12 },
      { "date": "2025-01-15", "count": 15 }
    ]
  },
  "engagement": {
    "anonymousLikes": 750,
    "anonymousReplies": 520,
    "authenticatedLikes": 500,
    "authenticatedReplies": 323
  },
  "topContent": [
    {
      "contentId": "article-123",
      "likeCount": 45,
      "replyCount": 28
    }
  ]
}
```

**Example Request:**
```bash
curl -X GET '/api/analytics/stats?period=30d' \
  -H 'Cookie: session-token=...'
```

## Components

### StatsCard
Location: `src/components/admin/stats-card.tsx`

Displays a single metric with icon and optional trend.

**Props:**
```typescript
{
  title: string;           // Card title
  value: number | string;  // Main metric value
  icon: LucideIcon;        // Icon component
  trend?: {                // Optional trend data
    value: number;         // Percentage change
    isPositive: boolean;   // Direction of change
  };
  description?: string;    // Additional context
  color?: 'blue' | 'green' | 'purple' | 'pink' | 'orange';
}
```

### EngagementChart
Location: `src/components/admin/engagement-chart.tsx`

Line chart showing likes and replies over time.

**Props:**
```typescript
{
  likesData: Array<{ date: string; count: number }>;
  repliesData: Array<{ date: string; count: number }>;
  title?: string;
}
```

### UserTypeChart
Location: `src/components/admin/user-type-chart.tsx`

Pie chart showing anonymous vs authenticated breakdown.

**Props:**
```typescript
{
  anonymousLikes: number;
  authenticatedLikes: number;
  anonymousReplies: number;
  authenticatedReplies: number;
  type: 'likes' | 'replies';
}
```

## Database Queries

The analytics API performs several optimized queries:

**Total Counts:**
```sql
SELECT count(*) FROM likes;
SELECT count(*) FROM replies;
SELECT count(*) FROM user;
SELECT count(*) FROM user WHERE is_anonymous = true;
```

**Period Counts:**
```sql
SELECT count(*) FROM likes
WHERE created_at >= $startDate;
```

**Daily Aggregates:**
```sql
SELECT DATE(created_at) as date, count(*) as count
FROM likes
WHERE created_at >= $startDate
GROUP BY DATE(created_at)
ORDER BY DATE(created_at);
```

**User Type Breakdown:**
```sql
SELECT count(*) FROM likes
LEFT JOIN user ON likes.user_id = user.id
WHERE user.is_anonymous = true;
```

All queries are indexed for performance.

## Performance Considerations

### Optimization Tips

1. **Use Period Filters**: Shorter periods load faster
2. **Cache Results**: Consider caching for high-traffic dashboards
3. **Index Dates**: Ensure `created_at` columns are indexed
4. **Paginate Top Content**: Limit to top 10-20 items

### Database Indexes

Recommended indexes:
```sql
CREATE INDEX idx_likes_created_at ON likes(created_at);
CREATE INDEX idx_replies_created_at ON replies(created_at);
CREATE INDEX idx_user_is_anonymous ON user(is_anonymous);
```

### Load Times

Expected query times:
- **7d period**: ~100-200ms
- **30d period**: ~200-400ms
- **90d period**: ~400-800ms
- **All time**: ~800ms-2s (depends on data volume)

## Interpreting the Data

### Key Metrics to Track

**Engagement Rate:**
```
(Likes + Replies) / Total Content Views
```

**Anonymous Conversion:**
```
Authenticated Users / Total Users × 100
```

**Reply Rate:**
```
Replies / Likes × 100
```

Higher reply rate indicates deeper engagement.

### What Good Metrics Look Like

**Healthy Engagement:**
- Steady or increasing trend lines
- Balanced likes and replies
- Growing authenticated user base
- 20-40% anonymous conversion rate

**Red Flags:**
- Declining engagement
- All likes, no replies (shallow engagement)
- High anonymous ratio with no conversion
- Sudden spikes (possible spam)

## Troubleshooting

### Issue: No Data Showing

**Possible Causes:**
- No interactions in database yet
- Period filter too restrictive
- API error (check console)

**Solution:**
- Create test interactions
- Switch to "All Time" period
- Check browser console for errors
- Verify database connection

### Issue: Charts Not Rendering

**Possible Causes:**
- Recharts not installed
- CSS conflicts
- Data format issues

**Solution:**
```bash
pnpm install recharts
```
- Clear browser cache
- Check data format matches schema

### Issue: Unauthorized Error

**Possible Causes:**
- Not logged in as admin
- Anonymous session
- Session expired

**Solution:**
- Log in at `/admin/login`
- Ensure full account (not guest)
- Refresh session

### Issue: Slow Loading

**Possible Causes:**
- Large dataset
- Missing indexes
- Network latency

**Solution:**
- Use shorter time periods
- Add database indexes
- Enable caching
- Optimize queries

## Future Enhancements

Planned features:
1. **Real-time Updates**: WebSocket for live data
2. **Trend Indicators**: % change vs previous period
3. **Content Rankings**: Most liked/replied articles
4. **User Retention**: Track return visitors
5. **Conversion Funnels**: Anonymous → Authenticated
6. **A/B Testing**: Compare feature variants
7. **Alert System**: Notify on anomalies
8. **Custom Reports**: Build your own dashboards
9. **CSV Export**: Download in spreadsheet format
10. **Scheduled Reports**: Email daily/weekly summaries

## Security

### Access Control

- Only authenticated admins can access
- Anonymous users blocked at middleware
- Session validation on every request
- CSRF protection via better-auth

### Data Privacy

- No personally identifiable information exposed
- Aggregated data only
- Anonymous users truly anonymous
- GDPR compliant

### Rate Limiting

Consider implementing:
- Max 60 requests/minute per admin
- Throttle expensive queries
- Cache results for 1 minute

## Best Practices

1. **Check Daily**: Review metrics every morning
2. **Track Trends**: Look for patterns, not single data points
3. **Compare Periods**: Week-over-week, month-over-month
4. **Export Regularly**: Archive monthly reports
5. **Share Insights**: Keep team informed
6. **Act on Data**: Use insights to improve content
7. **Monitor Anonymous**: Track conversion opportunities
8. **Celebrate Wins**: Share engagement growth

## Support

For issues or questions:
1. Check browser console for errors
2. Verify you're logged in as admin
3. Test with different time periods
4. Review database query logs
5. Check `docs/ANALYTICS_GUIDE.md` (this file)

## Related Documentation

- `MIGRATION_GUIDE.md` - better-auth setup
- `GUEST_INTERACTIONS_GUIDE.md` - Like/reply features
- API documentation - Endpoint specs
