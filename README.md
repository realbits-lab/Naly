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

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
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
- **AI SDK**: Vercel AI SDK with OpenAI
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons
- **Validation**: Zod schemas
- **Package Manager**: pnpm

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
