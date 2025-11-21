import { NextRequest, NextResponse } from 'next/server';
import { ContentCard } from '@/lib/feed/types';

// Mock data generator (same as feed route)
function generateMockCard(index: number): ContentCard {
  const categories: ContentCard['category'][] = ['stock', 'coin', 'sports', 'politics'];
  const category = categories[index % categories.length];

  const mockData: Record<ContentCard['category'], { titles: string[]; summaries: string[] }> = {
    stock: {
      titles: [
        'Tech Giants Rally as AI Adoption Accelerates',
        'Fed Signals Potential Rate Cuts in Coming Months',
        'Semiconductor Stocks Surge on Record Demand',
        'Wall Street Sees Best Quarter in Five Years',
        'Retail Investors Drive Meme Stock Resurgence',
      ],
      summaries: [
        'Major technology companies saw significant gains as enterprise AI adoption continues to accelerate across industries.',
        'Federal Reserve officials hinted at potential interest rate reductions, sending markets to new highs.',
        'Chip manufacturers report unprecedented demand driven by AI infrastructure buildout.',
        'Strong earnings reports and positive economic indicators push markets higher.',
        'Social media-driven trading activity returns as retail investors pile into momentum stocks.',
      ],
    },
    coin: {
      titles: [
        'Bitcoin Breaks $100K Milestone',
        'Ethereum 2.0 Upgrade Shows Promise',
        'Institutional Adoption of Crypto Accelerates',
        'DeFi Total Value Locked Hits New Record',
        'Central Banks Explore Digital Currencies',
      ],
      summaries: [
        'The leading cryptocurrency reaches a historic milestone amid growing institutional interest.',
        'Network improvements show significant reduction in energy consumption and increased throughput.',
        'Major financial institutions announce expanded cryptocurrency services for clients.',
        'Decentralized finance protocols attract record capital as yields remain attractive.',
        'Multiple central banks advance CBDC pilot programs amid growing digital payment adoption.',
      ],
    },
    sports: {
      titles: [
        'Championship Finals Set for Historic Showdown',
        'Rising Star Breaks Transfer Record',
        'Olympic Committee Announces New Sports',
        'Underdog Team Stuns Champions',
        'Legendary Coach Announces Retirement',
      ],
      summaries: [
        'Two powerhouse teams prepare for what analysts call the most anticipated finals in decades.',
        'Young talent moves in record-breaking deal that could reshape the sport landscape.',
        'New athletic disciplines will debut at the upcoming games, expanding global participation.',
        'In a stunning upset, underdogs defeat reigning champions in overtime thriller.',
        'After decades of success, beloved coach steps away from the game.',
      ],
    },
    politics: {
      titles: [
        'Historic Climate Agreement Reached',
        'Tech Regulation Bill Advances',
        'International Summit Addresses Trade',
        'Healthcare Reform Debate Intensifies',
        'Infrastructure Investment Plan Unveiled',
      ],
      summaries: [
        'World leaders agree on ambitious emissions targets in breakthrough climate negotiations.',
        'Lawmakers move forward with comprehensive technology oversight legislation.',
        'Global leaders gather to address trade imbalances and supply chain resilience.',
        'Competing visions for healthcare system improvements dominate policy discussions.',
        'Major investment in roads, bridges, and digital infrastructure announced.',
      ],
    },
  };

  const data = mockData[category];
  const titleIndex = Math.floor(index / 4) % data.titles.length;

  const now = new Date();
  const hoursAgo = Math.floor(Math.random() * 48) + 1;
  const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  return {
    id: `article-${index + 1}`,
    title: data.titles[titleIndex],
    summary: data.summaries[titleIndex],
    content: `${data.summaries[titleIndex]}\n\nThis is a detailed article about ${data.titles[titleIndex].toLowerCase()}. The content here would typically be much longer and include multiple paragraphs of analysis, expert quotes, and relevant data.\n\nKey points covered in this article include market trends, expert analysis, and future predictions. Readers can expect comprehensive coverage of the topic with multiple perspectives.\n\nThe implications of this development are far-reaching and could impact various sectors of the economy. Analysts are closely monitoring the situation for further developments.\n\nExperts weigh in on the significance of these events and their potential long-term effects. Industry leaders have shared their perspectives on how this will shape the future landscape.\n\nStay tuned for more updates as this story continues to develop.`,
    thumbnailUrl: `https://picsum.photos/seed/${index + 1}/400/225`,
    category,
    createdAt: createdAt.toISOString(),
    viewCount: Math.floor(Math.random() * 10000) + 100,
    predictedEngagement: Math.floor(Math.random() * 40) + 60,
    trends: ['trending', category, 'breaking'],
    sources: [
      'https://example.com/source1',
      'https://example.com/source2',
      'https://example.com/source3',
    ],
  };
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id } = await context.params;

  // Extract article index from ID (e.g., "article-5" -> 5)
  const match = id.match(/article-(\d+)/);
  if (!match) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const articleIndex = parseInt(match[1], 10) - 1;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Generate the article
  const article = generateMockCard(articleIndex);

  // Generate related articles (same category, different articles)
  const related: ContentCard[] = [];
  for (let i = 0; i < 5; i++) {
    const relatedIndex = (articleIndex + (i + 1) * 4) % 100;
    related.push(generateMockCard(relatedIndex));
  }

  return NextResponse.json({
    article,
    related,
  });
}
