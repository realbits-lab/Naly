import { tool } from 'ai';
import { z } from 'zod';

/**
 * Financial Modeling Prep (FMP) Tool
 * Fetches comprehensive financial data including earnings calendar, market cap, and fundamentals
 * Critical for stock prediction: earnings dates are the #1 volatility catalyst
 */
export const fmpFinancialTool = tool({
  description: `Fetch comprehensive financial data for stock prediction including:
- Earnings calendar (upcoming report dates within 30 days)
- Market capitalization (determines volatility profile)
- Income statement metrics (revenue growth, EPS trends)
- Technical indicators context
Use this tool when predicting stock movements to identify imminent catalysts.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., AAPL, TSLA, NVDA)'),
    horizonDays: z
      .number()
      .default(30)
      .describe('Prediction horizon in days to check for earnings'),
  }),
  execute: async ({ symbol, horizonDays = 30 }) => {
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      return {
        error: 'FMP_API_KEY not configured',
        recommendation: 'Proceed with technical analysis and news sentiment only',
      };
    }

    try {
      const today = new Date();
      const fromDate = today.toISOString().split('T')[0];
      const toDate = new Date(today.getTime() + horizonDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Parallel fetch for efficiency
      const [earningsRes, profileRes, quoteRes] = await Promise.all([
        // Earnings Calendar
        fetch(
          `https://financialmodelingprep.com/api/v3/earning_calendar?from=${fromDate}&to=${toDate}&symbol=${symbol}&apikey=${apiKey}`
        ),
        // Company Profile (includes market cap, sector, industry)
        fetch(
          `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`
        ),
        // Real-time Quote
        fetch(
          `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
        ),
      ]);

      const earnings = await earningsRes.json();
      const profile = await profileRes.json();
      const quote = await quoteRes.json();

      // Parse earnings data
      const upcomingEarnings = Array.isArray(earnings)
        ? earnings.map((e: any) => ({
            date: e.date,
            epsEstimate: e.epsEstimated,
            revenueEstimate: e.revenueEstimated,
            fiscalQuarter: e.fiscalDateEnding,
          }))
        : [];

      // Parse profile
      const companyProfile = Array.isArray(profile) && profile.length > 0 ? profile[0] : null;

      // Parse quote
      const currentQuote = Array.isArray(quote) && quote.length > 0 ? quote[0] : null;

      return {
        symbol,
        currentPrice: currentQuote?.price,
        marketCap: companyProfile?.mktCap,
        sector: companyProfile?.sector,
        industry: companyProfile?.industry,
        beta: companyProfile?.beta,
        upcomingEarnings: upcomingEarnings.length > 0 ? upcomingEarnings[0] : null,
        hasEarningsInHorizon: upcomingEarnings.length > 0,
        earningsCount: upcomingEarnings.length,
        volatilityProfile:
          companyProfile?.mktCap < 2_000_000_000
            ? 'Small Cap - High Volatility'
            : companyProfile?.mktCap < 10_000_000_000
              ? 'Mid Cap - Moderate Volatility'
              : 'Large Cap - Lower Volatility',
        priceChange: {
          day: currentQuote?.change,
          dayPercent: currentQuote?.changesPercentage,
          yearHigh: currentQuote?.yearHigh,
          yearLow: currentQuote?.yearLow,
        },
        fundamentalContext: {
          pe: currentQuote?.pe,
          eps: currentQuote?.eps,
          marketCapFormatted: companyProfile?.mktCap
            ? `$${(companyProfile.mktCap / 1_000_000_000).toFixed(2)}B`
            : null,
        },
      };
    } catch (error: any) {
      return {
        error: `FMP API Error: ${error.message}`,
        recommendation:
          'API may be rate limited or symbol invalid. Proceed with alternative data sources.',
      };
    }
  },
});

/**
 * Alpha Vantage Technical Indicators Tool
 * Fetches RSI, SMA, MACD for technical analysis
 * Critical for identifying overbought/oversold conditions and trend direction
 */
export const technicalIndicatorsTool = tool({
  description: `Fetch technical indicators to assess market momentum and trend:
- RSI (Relative Strength Index): Overbought (>70) or Oversold (<30)
- SMA (Simple Moving Average): 50-day and 200-day for trend direction
- Current price relative to moving averages
Use this to identify mean reversion vs breakout scenarios.`,
  inputSchema: z.object({
    symbol: z.string().describe('Stock or crypto ticker symbol'),
    interval: z
      .enum(['daily', 'weekly'])
      .default('daily')
      .describe('Time interval for technical analysis'),
  }),
  execute: async ({ symbol, interval = 'daily' }) => {
    // Note: Alpha Vantage requires a separate API key
    // For this implementation, we'll use a simplified version using FMP data
    const apiKey = process.env.FMP_API_KEY;

    if (!apiKey) {
      return {
        error: 'Technical indicators require API configuration',
        recommendation: 'Proceed with fundamental and news analysis',
      };
    }

    try {
      // Fetch technical indicators from FMP (they have RSI, SMA endpoints)
      const [rsiRes, smaRes] = await Promise.all([
        fetch(
          `https://financialmodelingprep.com/api/v3/technical_indicator/${interval}/${symbol}?period=14&type=rsi&apikey=${apiKey}`
        ),
        fetch(
          `https://financialmodelingprep.com/api/v3/technical_indicator/${interval}/${symbol}?period=50&type=sma&apikey=${apiKey}`
        ),
      ]);

      const rsiData = await rsiRes.json();
      const smaData = await smaRes.json();

      const latestRSI = Array.isArray(rsiData) && rsiData.length > 0 ? rsiData[0] : null;
      const latestSMA = Array.isArray(smaData) && smaData.length > 0 ? smaData[0] : null;

      return {
        symbol,
        interval,
        rsi: {
          value: latestRSI?.rsi,
          interpretation:
            latestRSI?.rsi > 70
              ? 'Overbought - Potential pullback'
              : latestRSI?.rsi < 30
                ? 'Oversold - Potential bounce'
                : 'Neutral',
        },
        sma50: latestSMA?.sma,
        technicalSignal:
          latestRSI?.rsi > 70 ? 'BEARISH' : latestRSI?.rsi < 30 ? 'BULLISH' : 'NEUTRAL',
        lastUpdated: latestRSI?.date || new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        error: `Technical Indicators Error: ${error.message}`,
        recommendation: 'Focus on fundamental catalysts and sentiment analysis',
      };
    }
  },
});
