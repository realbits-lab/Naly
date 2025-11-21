# Naly - Predictive Content Service

Naly is an AI-powered predictive content service that automates the entire content creation workflow using a multi-agent system. This project implements issue #39 - a comprehensive content generation pipeline with four specialized AI agents.

## Overview

Naly uses a sequential workflow of AI agents to transform ideas into market-ready content:

1. **AI Reporter** - Researches current trends and creates initial content
2. **AI Editor** - Reviews, refines, and improves the content quality
3. **AI Designer** - Suggests visual assets and layout strategies
4. **AI Marketer** - Optimizes for engagement and predicts performance metrics

## Features

- Multi-agent AI workflow for content generation
- Support for multiple content topics: Stock, Coin, Sports, Politics
- Regional content targeting (US, KR)
- Real-time content generation with visual feedback
- Performance prediction and ad placement optimization
- Modern, responsive UI built with Next.js and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/realbits-lab/Naly.git
cd Naly
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your required environment variables:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
DATABASE_URL=your_database_url_here
CRON_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

Generate a secure CRON_SECRET:
```bash
openssl rand -base64 32
```

### Running the Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/
│   ├── actions.ts       # Server actions for content generation
│   ├── page.tsx         # Main UI component
│   └── layout.tsx       # Root layout
└── lib/
    └── agents/
        ├── types.ts     # TypeScript types and schemas
        ├── reporter.ts  # Reporter agent implementation
        ├── editor.ts    # Editor agent implementation
        ├── designer.ts  # Designer agent implementation
        └── marketer.ts  # Marketer agent implementation
```

## Architecture

The application uses the Vercel AI SDK with OpenAI's GPT-4o model to power each agent. The workflow is:

1. User selects topic and region
2. Reporter agent researches and creates initial content
3. Editor agent reviews and improves the content
4. Designer agent suggests visual assets and layouts
5. Marketer agent predicts metrics and suggests ad placements
6. Results are displayed in a sequential, animated UI

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **AI SDK**: Vercel AI SDK with Google Gemini
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons
- **Validation**: Zod schemas
- **Package Manager**: pnpm
- **Deployment**: Vercel with Cron Jobs

## Automated Scheduling

Naly uses Vercel Cron Jobs to automatically trigger AI agents on a schedule.

### Configuration

Cron jobs are configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/tick",
      "schedule": "0 * * * *"
    }
  ]
}
```

The schedule `0 * * * *` runs every hour. All schedules use UTC timezone.

### Environment Variables

Set the following in your Vercel dashboard and local `.env`:

- `CRON_SECRET`: A random string (16+ characters) to secure the cron endpoint
- `NEXTAUTH_URL`: Your application's base URL

### Vercel Dashboard

1. Deploy your application to Vercel
2. Add `CRON_SECRET` in Settings → Environment Variables
3. View cron execution logs in the "Cron Jobs" tab
4. Monitor automated agent runs in the admin dashboard

### Local Testing

Test the cron endpoint locally:

```bash
curl http://localhost:3000/api/cron/tick \
  -H "Authorization: Bearer your-cron-secret"
```

Or use the "Test Cron Endpoint" button in the admin dashboard.

### Admin Dashboard

The admin dashboard displays:
- Cron job status and schedule
- Last execution time and status
- Number of jobs triggered
- Execution duration
- Manual test button

### Limitations

- **Free Tier**: 2 cron jobs max, each can run max once per day
- **Production Only**: Cron jobs only run on production deployments
- **UTC Timezone**: All schedules use UTC (no timezone configuration)
- **No Retries**: Vercel does not automatically retry failed cron jobs

For more information, see [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs).

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
