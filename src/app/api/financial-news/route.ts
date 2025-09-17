import { NextRequest, NextResponse } from 'next/server'

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  source: string
  publishedAt: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  category?: string
  symbols?: string[]
  url?: string
}

// Mock financial news data that resembles real API responses
const MOCK_FINANCIAL_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Federal Reserve Signals Potential Rate Cut Amid Economic Uncertainty',
    summary: 'The Federal Reserve indicated today that it may consider cutting interest rates in the coming months as economic indicators show mixed signals.',
    content: 'Federal Reserve Chair Jerome Powell suggested during today\'s press conference that the central bank is closely monitoring economic data and may adjust monetary policy accordingly...',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    sentiment: 'negative',
    category: 'monetary-policy',
    symbols: ['SPY', 'QQQ'],
    url: 'https://example.com/fed-rate-cut'
  },
  {
    id: '2',
    title: 'Tech Giants Report Strong Q4 Earnings Despite Market Volatility',
    summary: 'Major technology companies exceeded analyst expectations in their fourth-quarter earnings reports, showing resilience in a challenging market environment.',
    content: 'Apple, Microsoft, and Google parent Alphabet all reported earnings that surpassed Wall Street estimates, driving tech stocks higher in after-hours trading...',
    source: 'MarketWatch',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    sentiment: 'positive',
    category: 'earnings',
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    url: 'https://example.com/tech-earnings'
  },
  {
    id: '3',
    title: 'Oil Prices Surge on Middle East Tensions and Supply Concerns',
    summary: 'Crude oil futures jumped over 4% today following reports of increased tensions in the Middle East and concerns about global supply disruptions.',
    content: 'Brent crude oil futures rose to $85.50 per barrel, marking the highest level in three months as geopolitical tensions escalate in key oil-producing regions...',
    source: 'Bloomberg',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    sentiment: 'neutral',
    category: 'commodities',
    symbols: ['USO', 'XOM', 'CVX'],
    url: 'https://example.com/oil-surge'
  },
  {
    id: '4',
    title: 'Banking Sector Faces Regulatory Scrutiny Over Digital Assets',
    summary: 'Federal regulators are increasing oversight of banks\' exposure to cryptocurrency and digital assets, potentially impacting sector valuations.',
    content: 'The Office of the Comptroller of the Currency issued new guidance requiring banks to obtain approval before engaging in certain cryptocurrency activities...',
    source: 'Financial Times',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    sentiment: 'negative',
    category: 'regulation',
    symbols: ['XLF', 'JPM', 'BAC'],
    url: 'https://example.com/bank-regulation'
  },
  {
    id: '5',
    title: 'Electric Vehicle Sales Accelerate as Infrastructure Improves',
    summary: 'EV sales data shows continued growth momentum as charging infrastructure expansion addresses consumer concerns about range anxiety.',
    content: 'Electric vehicle deliveries increased 28% year-over-year in Q4, with Tesla leading the market but facing increased competition from traditional automakers...',
    source: 'CNBC',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    sentiment: 'positive',
    category: 'automotive',
    symbols: ['TSLA', 'F', 'GM'],
    url: 'https://example.com/ev-sales'
  },
  {
    id: '6',
    title: 'Inflation Data Shows Mixed Signals for Monetary Policy',
    summary: 'Latest Consumer Price Index data reveals persistent core inflation despite falling headline numbers, complicating Federal Reserve decisions.',
    content: 'The CPI rose 3.2% year-over-year in December, with core inflation excluding food and energy remaining elevated at 3.9%...',
    source: 'Wall Street Journal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 hours ago
    sentiment: 'neutral',
    category: 'economic-data',
    symbols: ['TIP', 'IEF'],
    url: 'https://example.com/inflation-data'
  },
  {
    id: '7',
    title: 'Semiconductor Stocks Rally on AI Chip Demand Forecast',
    summary: 'Major semiconductor companies see stock prices rise following industry reports projecting massive growth in AI chip demand through 2025.',
    content: 'Industry analysts project that AI chip demand will grow by 85% annually over the next two years, benefiting major semiconductor manufacturers...',
    source: 'TechCrunch',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    sentiment: 'positive',
    category: 'technology',
    symbols: ['NVDA', 'AMD', 'TSM'],
    url: 'https://example.com/ai-chips'
  },
  {
    id: '8',
    title: 'Global Supply Chain Disruptions Impact Manufacturing Outlook',
    summary: 'International shipping delays and port congestion continue to affect global manufacturing, raising concerns about economic growth.',
    content: 'Manufacturing PMI data from key economies shows continued weakness as supply chain bottlenecks persist, affecting production schedules...',
    source: 'Associated Press',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), // 14 hours ago
    sentiment: 'negative',
    category: 'supply-chain',
    symbols: ['IYJ', 'FDX', 'UPS'],
    url: 'https://example.com/supply-chain'
  }
]

// Generate additional mock articles to reach 100
function generateMockNews(count: number): NewsArticle[] {
  const categories = ['technology', 'healthcare', 'finance', 'energy', 'consumer', 'real-estate']
  const sources = ['Reuters', 'Bloomberg', 'MarketWatch', 'CNBC', 'Financial Times', 'Wall Street Journal']
  const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral']

  const baseArticles = [...MOCK_FINANCIAL_NEWS]

  // Generate additional articles to reach the requested count
  for (let i = baseArticles.length; i < count; i++) {
    const category = categories[i % categories.length]
    const source = sources[i % sources.length]
    const sentiment = sentiments[i % sentiments.length]
    const hoursAgo = Math.floor(i / 3) + 1

    baseArticles.push({
      id: `mock-${i}`,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Sector Update: Market Analysis for ${new Date().toLocaleDateString()}`,
      summary: `Latest developments in the ${category} sector show ${sentiment} trends with potential impact on investor portfolios and market outlook.`,
      content: `Detailed analysis of ${category} sector performance indicates ${sentiment} momentum based on recent data and analyst reports...`,
      source,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * hoursAgo).toISOString(),
      sentiment,
      category,
      symbols: [`${category.toUpperCase().slice(0,3)}`, 'SPY'],
      url: `https://example.com/${category}-${i}`
    })
  }

  return baseArticles.slice(0, count)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const category = searchParams.get('category')
    const sentiment = searchParams.get('sentiment')

    // In a real implementation, you would fetch from a financial news API like:
    // - Marketaux (https://www.marketaux.com/api)
    // - Alpha Vantage News & Sentiment API
    // - Financial Modeling Prep News API
    // - NewsAPI for business/finance

    // For now, we'll use mock data that represents realistic financial news
    let articles = generateMockNews(limit)

    // Apply filters
    if (category && category !== 'all') {
      articles = articles.filter(article => article.category === category)
    }

    if (sentiment && sentiment !== 'all') {
      articles = articles.filter(article => article.sentiment === sentiment)
    }

    // Sort by most recent first
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return NextResponse.json({
      articles: articles.slice(0, limit),
      total: articles.length,
      timestamp: new Date().toISOString(),
      source: 'Financial News API'
    })

  } catch (error) {
    console.error('Failed to fetch financial news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial news' },
      { status: 500 }
    )
  }
}

// Example implementation for real API integration (commented out)
/*
async function fetchFromMarketauxAPI(limit: number, category?: string) {
  const API_KEY = process.env.MARKETAUX_API_KEY
  if (!API_KEY) {
    throw new Error('MARKETAUX_API_KEY not configured')
  }

  const params = new URLSearchParams({
    api_token: API_KEY,
    countries: 'us',
    filter_entities: 'true',
    limit: limit.toString(),
    sort: 'published_desc',
    ...(category && { categories: category })
  })

  const response = await fetch(`https://api.marketaux.com/v1/news/all?${params}`)

  if (!response.ok) {
    throw new Error(`Marketaux API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data.map((item: any) => ({
    id: item.uuid,
    title: item.title,
    summary: item.description,
    content: item.snippet,
    source: item.source,
    publishedAt: item.published_at,
    sentiment: item.sentiment?.toLowerCase(),
    category: item.categories?.[0],
    symbols: item.entities?.map((e: any) => e.symbol).filter(Boolean),
    url: item.url
  }))
}
*/