# Implementation Plan - AI Agent Scheduling & Monitoring

## Goal
Implement the admin interface and backend infrastructure for scheduling and monitoring AI agents (Reporter, Marketer) with automated AI Editor reviews, secured by NextAuth.

## User Review Required
> [!IMPORTANT]
> I will be using **Drizzle ORM with Neon Database** (PostgreSQL) as requested.
> I will be using **NextAuth v5** for authentication.
> I will create a new **AI Editor Agent** as it does not currently exist.

## Proposed Changes

### Infrastructure & Config
#### [NEW] [drizzle.config.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/drizzle.config.ts)
- Configuration for Drizzle Kit.

#### [NEW] [index.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/db/index.ts)
- Database connection setup using `@neondatabase/serverless` and `drizzle-orm/neon-http`.

#### [NEW] [schema.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/db/schema.ts)
- Define `users`, `agentConfigs`, `agentRuns` tables using Drizzle schema definitions.

#### [NEW] [auth.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/auth.ts)
- Configure NextAuth with **Credentials provider only** (ID/Password).
- Verify credentials against the `users` table in Neon DB.

#### [NEW] [middleware.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/middleware.ts)
- Protect `/admin` routes.

### Backend & Agents
#### [NEW] [editor.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/lib/agents/editor.ts)
- Implement the AI Editor agent to review content.

#### [NEW] [scheduler.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/lib/scheduler.ts)
- Logic to check schedules and trigger jobs using Drizzle queries.

#### [NEW] [actions.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/app/actions.ts)
- Server actions for "Run Now", "Update Config", "Login".

### API Routes
#### [NEW] [route.ts](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/app/api/cron/tick/route.ts)
- Endpoint to be called by external cron (or manually) to trigger due jobs.

### Frontend UI
#### [NEW] [page.tsx](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/app/admin/login/page.tsx)
- Login page.

#### [NEW] [layout.tsx](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/app/admin/layout.tsx)
- Admin dashboard layout with navigation.

#### [NEW] [page.tsx](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/app/admin/dashboard/page.tsx)
- Dashboard overview.

#### [NEW] [page.tsx](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/app/admin/agents/page.tsx)
- Agent configuration settings.

#### [NEW] [page.tsx](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/app/admin/history/page.tsx)
- Run history list.

#### [NEW] [page.tsx](file:///Users/thomasjeon/GitHub/@dev.realbits/Naly/src/app/admin/history/[id]/page.tsx)
- Run details view.

## Verification Plan

### Automated Tests
- I will run the build to ensure type safety.
- I will verify the Drizzle schema push/migration.

### Manual Verification
1.  **Auth**: Try accessing `/admin/dashboard` without login (should redirect). Log in with seed credentials.
2.  **Config**: Go to `/admin/agents`, change the schedule for Reporter, save, and verify persistence in Neon DB.
3.  **Execution**: Click "Run Now" for Reporter.
    - Verify `agentRuns` record is created with "RUNNING" status.
    - Wait for completion.
    - Verify `agentRuns` updates to "COMPLETED".
    - Verify `editorReview` is populated.
4.  **Monitoring**: Check `/admin/history` to see the new run. Click into it to see the content and editor feedback.
