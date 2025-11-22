# Database Migration Notes

## New Table: cron_executions

A new table `cron_executions` has been added to track Vercel cron job executions.

### Schema

```sql
CREATE TABLE cron_executions (
  id SERIAL PRIMARY KEY,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status TEXT NOT NULL, -- 'RUNNING' | 'SUCCESS' | 'FAILED'
  jobs_triggered INTEGER DEFAULT 0,
  error_message TEXT,
  duration INTEGER -- in milliseconds
);
```

### Migration Steps

1. **Using Drizzle Kit** (recommended):
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit push
   ```

2. **Manual SQL** (if needed):
   Run the SQL statement above directly on your database.

### Verification

After migration, verify the table exists:
```sql
SELECT * FROM cron_executions LIMIT 5;
```

The table will initially be empty and will populate when cron jobs execute.
