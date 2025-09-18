# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server (Next.js on port 4000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint checks

### Database Commands
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate database schema types
- `pnpm db:studio` - Open Drizzle Studio for database management

### Environment Setup
- Use `dotenv --file .env.local run` prefix with pnpm commands for environment variables
- Ensure DATABASE_URL is configured in .env.local

## Project Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js 5.0 (beta) with Google OAuth
- **AI Integration**: Vercel AI SDK with OpenAI
- **UI**: Tailwind CSS + Radix UI components
- **Package Manager**: pnpm

### Core Application Structure

**Naly** is a financial analytics platform that transforms market data into explanatory narratives and probabilistic forecasts using AI.

#### Main Features:
1. **Market Analytics Engine** (`src/lib/analytics/`)
   - Event detection from market data
   - Technical analysis and trend identification
   - Real-time monitoring capabilities

2. **AI-Powered Narratives** (`src/lib/narrative/`)
   - Converts market events into readable stories
   - Generates explanatory content for complex financial data

3. **Prediction Engine** (`src/lib/prediction/`)
   - Probabilistic forecasting
   - Multi-scenario predictions with uncertainty analysis

4. **Causal Analysis** (`src/lib/causal-analysis/`)
   - Root cause analysis for market movements
   - Event correlation and impact assessment

5. **Community Features** (`src/lib/community/`)
   - User discussions and challenges
   - Achievement system and leaderboards

#### Key Service Architecture:
- **Service Registry** (`src/lib/service-registry.ts`) - Centralized service management
- **Financial Data Client** (`src/lib/financial-data-client.ts`) - External market data integration
- **Analytics Engine** (`src/lib/analytics/analytics-engine.ts`) - Core analysis orchestration

### Database Schema
Located in `src/lib/schema/` with modular organization:
- `events.ts` - Market events and data points
- `users.ts` - User management and authentication
- `analytics.ts` - Analysis results and metrics
- `community.ts` - Community features and interactions
- `articles.ts` - Content management
- `cron.ts` - Scheduled job management

### Authentication & Authorization
- Route protection system with role-based access
- Protected paths: `/dashboard`, `/portfolio`, `/narratives/personal`, `/settings`
- Admin paths: `/admin`
- Institutional paths: `/institutional`
- Public access: Landing pages, auth flows, public narratives

### API Structure
- **Public APIs**: `/api/public/*` - Unauthenticated endpoints
- **User APIs**: `/api/user/*` - User-specific operations
- **Analytics APIs**: `/api/analytics/*` - Market analysis endpoints
- **Community APIs**: `/api/community/*` - Social features
- **B2B APIs**: `/api/b2b/*` - Enterprise endpoints

### Component Organization
- **UI Components**: `src/components/ui/` - Reusable Radix UI components
- **Dashboard**: `src/components/dashboard/` - Main app interface
- **Narratives**: `src/components/narratives/` - Content display components
- **Community**: `src/components/community/` - Social feature components
- **Auth**: `src/components/auth/` - Authentication forms

## Development Guidelines

### Background Process Management
- Run `pnpm dev` as background process with output redirection to `logs/dev-server.log`
- Use port 4000 for development server (not port 3000)
- If port 4000 is in use, kill existing process and restart
- Use background execution for npx commands with output piping to logs directory

### Testing
- **Unit Tests**: Jest framework
- **E2E Tests**: Playwright with headless option
- **Authentication**: Use `@playwright/.auth/user.json` for Google OAuth in Playwright tests
- Default test account: jong95@gmail.com

### AI Gateway
- Use AI_GATEWAY_API_KEY instead of provider API keys when using Vercel AI Gateway

### Git Repository
- Current branch: feature/issue-2
- Main branch: main
- Always check current git repository URL before using GitHub MCP tools

## Important Notes

- The application handles complex financial data processing with real-time capabilities
- Authentication system supports multiple user roles (admin, institutional, regular users)
- The analytics engine can process multiple tickers in batches for performance
- Community features include gamification elements (achievements, leaderboards)
- All database operations use Drizzle ORM with type-safe queries
- Error handling follows a structured approach with ApplicationError types
- Use 4000 port for pnpm dev command in localhost